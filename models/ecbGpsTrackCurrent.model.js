import mongoose from "mongoose";

const ecbGpsTrackCurrentSchema = new mongoose.Schema(
  {
    etlDateTime: { type: Date, default: Date.now },
    etlSequenceNo: { type: Number },
    sysUserId: { type: Number, required: true },
    sysGpsLongitude: { type: String, required: true },
    sysGpsLatitude: { type: String, required: true },
    numberOfWalks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

let autoIncrement = 1;

ecbGpsTrackCurrentSchema.pre("save", async function (next) {
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

const ecbGpsTrackCurrent = mongoose.model(
  "EcbGpsTrackCurrent",
  ecbGpsTrackCurrentSchema
);

export default ecbGpsTrackCurrent;
