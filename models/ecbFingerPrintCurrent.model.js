import mongoose from "mongoose";

const ecbFingerPrintCurrentSchema = new mongoose.Schema(
  {
    etlDateTime: { type: Date, default: Date.now },
    etlSequenceNo: { type: Number },
    sysUserId: { type: Number, required: true },
    sysBiometricTemplate1: { type: Buffer, required: true },
    sysBiometricTemplate2: { type: Buffer, required: true },
  },
  { timestamps: true }
);

let autoIncrement = 1;

ecbFingerPrintCurrentSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
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

const ecbFingerPrintCurrent = mongoose.model(
  "EcbFingerPrintCurrent",
  ecbFingerPrintCurrentSchema
);

export default ecbFingerPrintCurrent;
