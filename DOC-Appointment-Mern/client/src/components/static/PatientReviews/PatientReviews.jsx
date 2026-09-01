import React from "react";
import "./PatientReviews.css";
import ReviewData from "./PatientReviews.json"; 

const PatientReviews = () => {
  return (
    <>
      <div className="review-container">
        <div className="heading-container">
          <p>Testimonial</p>
          <h1>What Our Patients</h1>
          <h1>Says About us.</h1>
        </div>
        
        {/* reviews */}
        <div className="row why-container">
          {ReviewData.map((d) => (
            <div className="col-md-3" key={d.id}>
              <img src={d.pic} alt="userpic" width="100px" />
              <p>
                {d.name} <br /> {d.address}
              </p>
              <div className="d-flex flex-row">
                <h6 className="icon">
                  <span className="fas fa-star active-star"></span>
                  <span className="fas fa-star active-star"></span>
                  <span className="fas fa-star active-star"></span>
                  <span className="fas fa-star active-star"></span>
                  <span className="fas fa-star-half-alt active-star"></span>
                </h6>
              </div>
              <h2>{d.commentTile}</h2>
              <p>{d.commentDescription}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default PatientReviews;