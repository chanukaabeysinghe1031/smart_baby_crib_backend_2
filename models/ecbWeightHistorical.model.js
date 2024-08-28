import mongoose from 'mongoose'

const ecbWeightHistoricalSchema = new mongoose.Schema({
  avgMarketAge: { type: Number, required: true },
  maleTop50PercentileWeight: { type: Number, required: true },
  femaleTop50PercentileWeight: { type: Number, required: true },
}, { timestamps: true })

ecbWeightHistoricalSchema.index({ avgMarketAge: 1 }, { unique: true })

const ecbWeightHistorical = mongoose.model('EcbWeightHistorical', ecbWeightHistoricalSchema)

export default ecbWeightHistorical
