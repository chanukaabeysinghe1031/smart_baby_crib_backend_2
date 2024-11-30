import ecbAINotes from "../models/ecbAINotes.model.js";

// Retrieve all notes by user within a date range
export const findAllNotesByUser = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.params.id;

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);

    const query = {
      etlDateTime: {
        $gte: start,
        $lte: end,
      },
      sysUserId: userId,
    };

    const notes = await ecbAINotes.find(query);
    res.status(200).json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new note
export const createNote = async (req, res) => {
  const { sysUserId, noteTitle, noteContent, noteCategory } = req.body;

  if (!sysUserId || !noteTitle || !noteContent) {
    return res.status(400).json({
      message: "sysUserId, noteTitle, and noteContent are required",
    });
  }

  const newNote = new ecbAINotes({
    sysUserId,
    noteTitle,
    noteContent,
    noteCategory, // Optional
  });

  try {
    const savedNote = await newNote.save();
    res.status(201).json(savedNote);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update a note by sysUserId and etlSequenceNo
export const updateNote = async (req, res) => {
  try {
    const { sysUserId, etlSequenceNo } = req.body;

    const updatedNote = await ecbAINotes.findOneAndUpdate(
      { sysUserId, etlSequenceNo },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedNote) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.status(200).json(updatedNote);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a note by sysUserId and etlSequenceNo
export const deleteNote = async (req, res) => {
  try {
    const { sysUserId, etlSequenceNo } = req.body;

    const deletedNote = await ecbAINotes.findOneAndDelete({
      sysUserId,
      etlSequenceNo,
    });

    if (!deletedNote) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.status(200).json({ message: "Note deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add a new note with a category (optional)
export const addNewNote = async (req, res) => {
  const { sysUserId, noteTitle, noteContent, noteCategory } = req.body;

  if (!sysUserId || !noteTitle || !noteContent) {
    return res.status(400).json({
      message: "sysUserId, noteTitle, and noteContent are required",
    });
  }

  try {
    const newNote = new ecbAINotes({
      sysUserId,
      noteTitle,
      noteContent,
      noteCategory, // Optional
    });

    const savedNote = await newNote.save();
    res.status(201).json(savedNote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
