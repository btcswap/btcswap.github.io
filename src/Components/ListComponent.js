import React from "react";

const ListComponent = props => {
  let { disabledToken, defaultValue, onChange, id, balances } = props;

  switch (disabledToken) {
    case "btc":
      return (
        <select className="browser-default" id={id} value={defaultValue} onChange={onChange}>
          <option value=""></option>
          <option value="wbtc">WBTC {balances["wbtc"] ? balances["wbtc"]: ""}</option>
          <option value="mcbtc">MCBTC {balances["mcbtc"] ? balances["mcbtc"]: ""}</option>
        </select>
      );
    case "wbtc":
        return (
          <select className="browser-default" id={id} value={defaultValue} onChange={onChange}>
            <option value=""></option>
            <option value="btc">BTC {balances["btc"] ? balances["btc"]: ""}</option>
            <option value="mcbtc">MCBTC {balances["mcbtc"] ? balances["mcbtc"]: ""}</option>
          </select>
        );
    case "mcbtc":
        return (
          <select className="browser-default" id={id} value={defaultValue} onChange={onChange}>
            <option value=""></option>
            <option value="btc">BTC {balances["btc"] ? balances["btc"]: ""}</option>
            <option value="wbtc">WBTC {balances["wbtc"] ? balances["wbtc"]: ""}</option>
          </select>
        );
    default:
      return (
        <select className="browser-default" id={id} value={defaultValue} onChange={onChange}>
            <option value="btc">BTC {balances["btc"] ? balances["btc"]: ""}</option>
            <option value="wbtc">WBTC {balances["wbtc"] ? balances["wbtc"]: ""}</option>
            <option value="mcbtc">MCBTC {balances["mcbtc"] ? balances["mcbtc"]: ""}</option>
        </select>
      );
  }
};

export default ListComponent;