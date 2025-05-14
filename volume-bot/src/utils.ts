import dotenv from 'dotenv'
import fs from 'fs'
dotenv.config()

export const retrieveEnvVariable = (variableName: string) => {
  const variable = process.env[variableName] || ''
  if (!variable) {
    console.log(`${variableName} is not set`)
    process.exit(1)
  }
  return variable
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


export const saveDataToFile = (newData: string[], filePath: string = "data.json") => {
  try {
    let existingData: string[] = [];

    // Check if the file exists
    if (fs.existsSync(filePath)) {
      // If the file exists, read its content
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      existingData = JSON.parse(fileContent);
    }

    // Add the new data to the existing array
    existingData.push(...newData);

    // Write the updated data back to the file
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

  } catch (error) {
    console.log('Error saving data to JSON file:', error);
  }
};


export function readJson(filename: string = "data.json"): string[] {
  try {
    if (!fs.existsSync(filename)) 
     return []
    
    const data = fs.readFileSync(filename, 'utf-8');
    const parsedData = JSON.parse(data)
    return parsedData
  } catch (error) {
    return []
  }
}