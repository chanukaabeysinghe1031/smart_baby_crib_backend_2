/*
ETL Date and time	
ETL S/N	
Userfed-Parent first name	
Userfed-Additional Parentname	
Userfed-Stroller Model#	
Userfed-Email address	
SYS-UserID
*/

import mongoose from "mongoose";

const ecbDeviceRegisterationSchema = new mongoose.Schema(
  {
    etlDateTime: { type: Date, default: Date.now },
    etlSequenceNo: { type: Number },
    userFedParentFirstName: { type: String, required: true },
    userFedStrollerModelNo: { type: String, required: true },
    sysUserId: { type: Number, required: true },
  },
  { timestamps: true }
);

ecbDeviceRegisterationSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const lastEntry = await this.constructor
        .findOne({ sysUserId: this.sysUserId })
        .sort({ etlSequenceNo: -1 });
      if (lastEntry) {
        this.etlSequenceNo = lastEntry.etlSequenceNo + 1;
      } else {
        this.etlSequenceNo = 1; // Start from 1 if no previous records are found for this user
      }
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

const ecbDeviceRegisteration = mongoose.model(
  "EcbDeviceRegisteration",
  ecbDeviceRegisterationSchema
);

export default ecbDeviceRegisteration;
