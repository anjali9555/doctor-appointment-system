import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { getDoctorDetails } from "../../redux/actions/doctorActions";
import { bookAppointment } from "../../redux/actions/authActions";; 

const Appointments = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [docInfo, setDocInfo] = useState(null);
  const [selectedDateTime, setSelectedDateTime] = useState(new Date());

  const { doctor } = useSelector((state) => state.doctor);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(getDoctorDetails(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (doctor) {
      setDocInfo(doctor);
    }
  }, [doctor]);

  const handleBooking = () => {
    if (!user || !user._id) {
      toast.error("Please login first to book an appointment!");
      return navigate("/login");
    }

    if (!selectedDateTime) {
      return toast.error("Please select a valid date and time");
    }

    const bookingData = {
      userId: user._id,
      doctorId: id,
      // 🔥 Fee ke liye fallback daal diya hai taaki undefined na ho
      amount: docInfo?.fee || docInfo?.fees || 500, 
      slotDate: selectedDateTime.toLocaleDateString(),
      slotTime: selectedDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    dispatch(bookAppointment(bookingData))
      .unwrap()
      .then((res) => {
        toast.success("Appointment Booked Successfully!");
        navigate("/user/appointments"); 
      })
      .catch((err) => {
        toast.error(err?.message || err || "Failed to book appointment");
      });
  };

  return (
    <>
      <div className="container docinfo-container my-4">
        <div className="row m-3">
          <div className="col-md-3 d-flex flex-column justify-content-center align-items-center">
            {/* 🔥 Safety check: Agar image hai tabhi base64 render karo, warna default image dikhao */}
            {docInfo?.image ? (
              <img
                src={`data:image/jpeg;base64,${docInfo.image}`}
                alt="docImage"
                height={200}
                width={200}
                style={{ objectFit: "cover", borderRadius: "10px" }}
              />
            ) : (
              <div style={{ height: 200, width: 200, background: "#ccc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                Loading...
              </div>
            )}
            
            <h6 className="mt-2">{docInfo?.name || "Doctor Name"}</h6>
            <h6
              className={`${
                docInfo?.available ? "text-success" : "text-danger"
              }`}
            >
              {docInfo?.available ? "Available" : "Not Available"}
            </h6>
          </div>

          <div className="col-md-8 d-flex flex-column justify-content-center m-3">
            <h6>Experience : {docInfo?.experience || "N/A"} Year's</h6>
            <h6 className="mt-2">About Doctor :</h6>
            <p>{docInfo?.about || "No description available."}</p>
            
            {/* 🔥 Fee property check */}
            <h5 className="mt-2">Consultation Fee : {docInfo?.fee || docInfo?.fees || "500"}</h5>

            {/* Date Time Picker Section */}
            <div className="date-time mt-3">
              <h6>Select Your Booking Date & Time :</h6>
              <DatePicker
                className="calender form-control"
                minDate={new Date()}
                selected={selectedDateTime}
                onChange={(date) => setSelectedDateTime(date)}
                showTimeSelect
                timeFormat="h:mm aa"
                timeIntervals={30}
                dateFormat="d-MMM-yyyy h:mm aa"
                timeCaption="Time"
              />
              <p className="mt-2">
                Your Selected Booking :{" "}
                {selectedDateTime
                  ? selectedDateTime.toLocaleString()
                  : "Please Select a date & Time"}
              </p>
            </div>

            <button
              className="btn btn-primary w-50 mt-3"
              disabled={docInfo?.available === false}
              onClick={handleBooking}
            >
              {docInfo?.available !== false ? "Book Now" : "Doctor Not Available"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// 🔥 Correct export syntax ('exports' ki jagah 'export')
export default Appointments;