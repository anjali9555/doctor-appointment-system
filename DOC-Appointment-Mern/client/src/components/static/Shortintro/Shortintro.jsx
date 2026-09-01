import React from "react";
import "./ShortIntro.css";
import ImageHos from "../../../assets/images/Hospital/host.png";

const ShortIntro = () => {
  return (
    <>
      <div className="intro-container">
        <div className="row">
          <div className="col-md-6 img-container">
            <img src={ImageHos} alt="hosimage" className="hos-image" />
          </div>
          <div className="col-md-6 info-container">
            <h1>Techinfo YT</h1>
            <h6>A Super Specility Hospital</h6>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
              Praesentium dolorem dolorum dicta, ipsam earum repellendus unde
              omnis tenetur. Laudantium dolorum obcaecati suscipit velit
            </p>
            <p>
              Lorem ipsum dolor sit amet consectetur adipisicing elit.
              Praesentium dolorem dolorum dicta, ipsam earum repellendus unde
              omnis tenetur. Laudantium dolorum obcaecati suscipit velit
            </p>
            <button className="btn btn-primary">Book A Appointment Now</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShortIntro;