import mongoose from "mongoose";

const ecbAINotesSchema = new mongoose.Schema(
  {
    etlDateTime: { type: Date, default: Date.now }, // Date and time when the record was created
    etlSequenceNo: { type: Number }, // Auto-incremented sequence number
    sysUserId: { type: Number, required: true }, // User ID associated with the note
    noteTitle: { type: String, required: true }, // Title of the note
    noteContent: { type: String, required: true }, // Content of the note
    noteCategory: { type: String }, // Optional category/tag for the note
    noteDate: { type: Date, default: Date.now },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt timestamps
);

let autoIncrement = 1;

// Middleware to handle sequence number and validations
ecbAINotesSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      // Fetch the latest record to determine the next sequence number
      const docs = await this.constructor
        .find()
        .sort({ etlSequenceNo: -1 })
        .limit(1);
      if (docs.length > 0) {
        autoIncrement = docs[0].etlSequenceNo + 1;
      }
      this.etlSequenceNo = autoIncrement;

      next();
    } catch (err) {
      return next(err);
    }
  } else {
    next();
  }
});

// Creating the model
const ecbAINotes = mongoose.model("EcbAINotes", ecbAINotesSchema);

export default ecbAINotes;
