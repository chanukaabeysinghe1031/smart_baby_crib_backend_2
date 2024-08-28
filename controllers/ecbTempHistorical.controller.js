import ecbTempHistorical from '../models/ecbTempHistorical.model.js'

// Retrieve all records
export const findAll = async (req, res) => {
  try {
    const data = await ecbTempHistorical.find()
    res.status(200).json(data)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Retrieve a single record by ID
export const findOne = async (req, res) => {
  try {
    const data = await ecbTempHistorical.findById(req.params.id)
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
  const data = new ecbTempHistorical(req.body)
  try {
    const newData = await data.save()
    res.status(201).json(newData)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// Update a record by user id
export const update = async (req, res) => {
  try {
    const { sysUserId, etlSequenceNo } = req.body
    const updatedData = await ecbAiNanny.findOneAndUpdate(
      { sysUserId: sysUserId, etlSequenceNo: etlSequenceNo },
      req.body,
      { new: true, runValidators: true }
    )

    if (!updatedData) {
      return res.status(404).json({ message: 'Data not found' })
    }

    res.status(200).json(updatedData)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// Delete a record by sysUserId and etlSequenceNo
export const deleteRecord = async (req, res) => {
  try {
    const { sysUserId, etlSequenceNo } = req.body;
    const deletedData = await ecbAiNanny.findOneAndDelete({ sysUserId: sysUserId, etlSequenceNo: etlSequenceNo });
    if (!deletedData) {
      return res.status(404).json({ message: 'Data not found' });
    }
    res.status(200).json({ message: 'Record deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}
