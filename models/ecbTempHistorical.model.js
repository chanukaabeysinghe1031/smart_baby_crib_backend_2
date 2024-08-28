import mongoose from 'mongoose'

const ecbTempHistoricalSchema = new mongoose.Schema({
  avgMarketAge: { type: Number, required: true },
  avgMarketTemperature: { type: Number, required: true },
}, { timestamps: true })

ecbTempHistoricalSchema.index({ avgMarketAge: 1 }, { unique: true })

const ecbTempHistorical = mongoose.model('EcbTempHistorical', ecbTempHistoricalSchema)

export default ecbTempHistorical
