import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize the API with the key from our .env file.
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)

/**
 * Helper to convert a File to a base64 inlineData object that Gemini can read.
 */
function fileToGenerativePart(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      // The result looks like: "data:image/jpeg;base64,...base64_string..."
      const splitIndex = reader.result.indexOf(',')
      const base64String = reader.result.slice(splitIndex + 1)
      
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type
        }
      })
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Sends the receipt image to Gemini and asks it to extract items and prices as JSON.
 */
export async function extractReceiptItems(imageFile) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    
    // Convert the image file
    const imagePart = await fileToGenerativePart(imageFile)

    // Strict prompt to force a specific plain text JSON output structure
    const prompt = `
      Analiza esta boleta de compra.
      Devuelve ÚNICAMENTE un arreglo en formato JSON (sin markdown, sin bloques de código, solo el json crudo).
      Extrae cada ítem comprado y su precio unitario estimado.
      Si hay varios del mismo en una sola línea, extrae el precio total de esa línea.
      Si no puedes leer bien algo, omítelo.
      
      Formato esperado exacto:
      [
        {"name": "nombre del producto", "price": 10.50},
        {"name": "otro producto", "price": 5.00}
      ]
    `

    const result = await model.generateContent([prompt, imagePart])
    const responseText = result.response.text()
    
    // Clean up potential markdown formatting that Gemini might sneak in
    let cleanJsonStr = responseText.trim()
    if (cleanJsonStr.startsWith('\`\`\`json')) {
      cleanJsonStr = cleanJsonStr.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim()
    } else if (cleanJsonStr.startsWith('\`\`\`')) {
      cleanJsonStr = cleanJsonStr.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim()
    }

    const itemsArr = JSON.parse(cleanJsonStr)
    
    // Add unique IDs to the returned parsed array
    return itemsArr.map((item, index) => ({
      id: index + 1,
      name: item.name,
      price: parseFloat(item.price)
    }))

  } catch (error) {
    console.error("Error extracted data via Gemini:", error)
    throw new Error("Error técnico al analizar la boleta: " + (error.message || JSON.stringify(error)))
  }
}
