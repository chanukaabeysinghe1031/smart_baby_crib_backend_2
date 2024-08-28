import EcbLengthHistorical from '../models/ecbLengthHistorical.model.js'

// Create a new record
export const create = async (req, res) => {
    try {
        const newRecord = new EcbLengthHistorical(req.body)
        const savedRecord = await newRecord.save()
        res.status(201).json(savedRecord)
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

// Retrieve all records
export const findAll = async (req, res) => {
    try {
        const records = await EcbLengthHistorical.find()
        res.status(200).json(records)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Retrieve a single record by ID
export const findOne = async (req, res) => {
    try {
        const record = await EcbLengthHistorical.findById(req.params.id)
        if (!record) {
            return res.status(404).json({ message: 'Record not found' })
        }
        res.status(200).json(record)
    } catch (error) {
        res.status(500).json({ message: error.message })
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
