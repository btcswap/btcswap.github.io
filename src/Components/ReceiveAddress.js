import React from "react";

const ReceiveAddress = props => {
  let { receiveToken, id, onChange } = props;

  if (receiveToken === "btc") {
      return (
          <React.Fragment>
          <div>
            <h2> to </h2>
          </div>
          <div>
            <input type="text" placeholder="address" className="grey-text text-darken-3" style={{textAlign: "center", fontSize: "40px", borderBottom: "2px solid black"}} id={id} onChange={onChange} />
          </div>
          </React.Fragment>
      );
  } else {
      return null;
  }
};

export default ReceiveAddress;