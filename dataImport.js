import fs from 'fs'
import mongoose from 'mongoose'
import ecbLengthHistorical from './models/ecbLengthHistorical.model.js'
import ecbWeightHistorical from './models/ecbWeightHistorical.model.js'

const lengthJson = JSON.parse(fs.readFileSync('data/lengthHistroical.json', 'utf8'));
const weightJson = JSON.parse(fs.readFileSync('data/weightHistorical.json', 'utf8'))

mongoose.connect('mongodb://localhost:27017/health-api')

async function insertData() {
  try {
    await ecbLengthHistorical.insertMany(lengthJson)
    console.log('Length data inserted:')
  } catch (error) {
    console.log('Error inserting length data:', error)
  }

  try {
    await ecbWeightHistorical.insertMany(weightJson)
    console.log('Weight data inserted:')
  } catch (error) {
    console.log('Error inserting weight data:', error)
  }

  mongoose.connection.close()
}

insertData()
