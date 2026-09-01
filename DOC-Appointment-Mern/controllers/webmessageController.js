import webmessageModel from "../models/webMessage.js";

//create message
export const createMessage = async (req, res) => {
  try {
    const { name, contact, message } = req.body;
    
    // Validation
    if (!name || !contact || !message) {
      // FIX: 400 is the proper status code for missing fields/Bad Request
      return res.status(400).send({
        success: false,
        message: "Please Provide All Fields",
      });
    }
    
    // Save to Database
    const webMessage = new webmessageModel({ name, contact, message });
    await webMessage.save(); // FIX: Added "await" so it actually waits for DB save
    
    // Success Response
    res.status(201).send({
      success: true,
      message: "Your Message Sent Successfully",
      webMessage,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error creating web message",
      error
    });
  }
};
// GET ALL MESSAGES
export const getAllMessages = async (req, res) => {
  try {
    const webMessages = await webmessageModel.find({});
    
    // FIX: Changed status code to 200 (OK for fetching data)
    res.status(200).send({
      success: true,
      message: "all web messages fetched successfully",
      totalCount: webMessages.length,
      webMessages,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in get all Web Message Api",
      error,
    });
  }
};
// ... (tumhare upar ke createMessage aur getAllMessages functions yahan rahenge) ...

// DELETE MESSAGE
export const deleteWebMessage = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(404).send({
        success: false,
        message: "Please Provide message id"
      });
    }

    // FIX: Using findByIdAndDelete directly. If it doesn't find it, it returns null.
    const webMessage = await webmessageModel.findByIdAndDelete(id);
    
    if (!webMessage) {
      return res.status(404).send({
        success: false,
        message: "Message not found or already deleted"
      });
    }

    // FIX: Changed status to 200 (OK)
    res.status(200).send({
      success: true,
      message: "Message has been deleted",
    });

  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      // FIX: Corrected the typo and API name
      message: "Error in Delete Web Message API", 
      error,
    });
  }
};