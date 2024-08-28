import ecbWeightCurrent from '../models/ecbWeightCurrent.model.js'

export const findAllByUser = async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const userId = req.params.id
    const start = new Date(startDate)
    const end = new Date(endDate)
    start.setUTCHours(0, 0, 0, 0)
    end.setUTCHours(23, 59, 59, 999)

    const query = {
      etlDateTime: {
        $gte: start,
        $lte: end
      },
      sysUserId: userId
    }

    const data = await ecbWeightCurrent.find(query)
    res.status(200).json(data)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Retrieve a single record by ID
export const findOne = async (req, res) => {
  try {
    const data = await ecbWeightCurrent.findById(req.params.id)
    if (!data) {
      return res.status(404).json({ message: 'Data not found' })
    }
    res.status(200).json(data)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Create a new record
export const create = async (req, res) => {
  const data = new ecbWeightCurrent(req.body)
  try {
    const newData = await data.save()
    res.status(201).json(newData)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}
