import mongoose from 'mongoose'

const ecbLengthHistoricalSchema = new mongoose.Schema({
  avgMarketAge: { type: Number, required: true },
  avgHeightMale: { type: Number, required: true },
  avgHeightFemale: { type: Number, required: true },
}, { timestamps: true })

ecbLengthHistoricalSchema.index({ avgMarketAge: 1 }, { unique: true })

const ecbLengthHistorical = mongoose.model('EcbLengthHistorical', ecbLengthHistoricalSchema);

export default ecbLengthHistorical