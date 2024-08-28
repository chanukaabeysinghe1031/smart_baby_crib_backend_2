import ecbDeviceRegistration from '../models/ecbDeviceRegistration.model.js'

// Retrieve all records
export const findAll = async (req, res) => {
  try {
    const data = await ecbDeviceRegistration.find()
    res.status(200).json(data)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Retrieve a single record by ID
export const findOne = async (req, res) => {
  try {
    const data = await ecbDeviceRegistration.findById(req.params.id)
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
  const data = new ecbDeviceRegistration(req.body)
  try {
    const newData = await data.save()
    res.status(201).json(newData)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// Update a record by ID
export const update = async (req, res) => {
  try {
    const updatedData = await ecbDeviceRegistration.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!updatedData) {
      return res.status(404).json({ message: 'Data not found' })
    }
    res.status(200).json(updatedData)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

// Delete a record by ID
export const deleteRecord = async (req, res) => {
  try {
    const deletedData = await ecbDeviceRegistration.findByIdAndDelete(req.params.id)
    if (!deletedData) {
      return res.status(404).json({ message: 'Data not found' })
    }
    res.status(200).json({ message: 'Record deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

