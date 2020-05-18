import React from "react";

const ListComponent = props => {
  let { disabledToken, defaultValue, onChange, id } = props;

  switch (disabledToken) {
    case "btc":
      return (
        <select className="browser-default" id={id} value={defaultValue} onChange={onChange}>
          <option value=""></option>
          <option value="wbtc">WBTC</option>
          <option value="mcbtc">MCBTC</option>
        </select>
      );
    case "wbtc":
        return (
          <select className="browser-default" id={id} value={defaultValue} onChange={onChange}>
            <option value=""></option>
            <option value="btc">BTC</option>
            <option value="mcbtc">MCBTC</option>
          </select>
        );
    case "mcbtc":
        return (
          <select className="browser-default" id={id} value={defaultValue} onChange={onChange}>
            <option value=""></option>
            <option value="btc">BTC</option>
            <option value="wbtc">WBTC</option>
          </select>
        );
    default:
      return (
        <select className="browser-default" id={id} value={defaultValue} onChange={onChange}>
            <option value="btc">BTC</option>
            <option value="wbtc">WBTC</option>
            <option value="mcbtc">MCBTC</option>
        </select>
      );
  }
};

export default ListComponent;