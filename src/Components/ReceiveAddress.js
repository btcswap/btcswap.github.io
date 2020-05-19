import React from "react";

const ReceiveAddress = props => {
  let { receiveToken, id, onChange } = props;

  if (receiveToken === "btc") {
      return (
          <React.Fragment>
          <div className="col s12 l1">
            <h2 className="div1"> to </h2>
          </div>
          <div  className="col s12 l5" style={{marginTop:'25px'}}>
            <input type="text" placeholder="address" className="grey-text text-darken-3 div2" style={{borderBottom: "2px solid black"}} id={id} onChange={onChange} />
          </div>
          </React.Fragment>
      );
  } else {
      return null;
  }
};

export default ReceiveAddress;