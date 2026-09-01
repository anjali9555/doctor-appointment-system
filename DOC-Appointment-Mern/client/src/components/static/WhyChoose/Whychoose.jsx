import React from "react";
import "./WhyChoose.css";
import Image1 from '../../../assets/images/Hospital/personalize.png';
import Image2 from '../../../assets/images/Hospital/trust.png';
import Image3 from '../../../assets/images/Hospital/empower.png';

const WhyChoose = () => {
  return (
    <>
      <h1 className="text-center mt-5">Why Choose Us?</h1>
      <div className="row why-container">
        
        {/* Column 1 */}
        <div className="col-md-3">
          <img src={Image1} alt="image1" width={"150px"} />
          <h2>Personalize Excellence</h2>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit.
            Cupiditate, error. Corporis, accusantium doloribus nihil repellendus
            debitis eveniet, a delectus architecto consequatur veritatis
            provident officiis soluta aut.debitis eveniet, a delectus architecto consequatur veritatis
            provident officiis soluta aut!
          </p>
        </div>

        {/* Column 2 */}
        <div className="col-md-3">
          <img src={Image2} alt="image2" width={"150px"} />
          <h2>Trusted Care</h2>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit.
            Cupiditate, error. Corporis, accusantium doloribus nihil repellendus
            debitis eveniet, a delectus architecto consequatur veritatis
            provident officiis soluta aut!
          </p>
        </div>

        {/* Column 3 */}
        <div className="col-md-3">
          <img src={Image3} alt="image3" width={"150px"} />
          <h2>Empowring Wellness Journey</h2>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit.
            Cupiditate, error. Corporis, accusantium doloribus nihil repellendus
            debitis eveniet, a delectus architecto consequatur veritatis
            provident officiis soluta aut!
          </p>
        </div>

      </div>
    </>
  );
};

export default WhyChoose;