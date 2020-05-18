import React, { Component } from 'react'
import ListComponent from './ListComponent';
import ReceiveAddress from './ReceiveAddress'; 

import GatewayJS from "@renproject/gateway";
import RenBTCAdapter from "../RenBTCAdapter.json";
import MultiBtcWrapper from "../MultiBtcWrapper.json";
import RenBTC from "../RenBTC.json";
import WBTC from "../WBTC.json";
import Web3 from "web3";

const mwbABI = MultiBtcWrapper.abi;
const mwbContractAddress = MultiBtcWrapper.networks["42"].address;

const renBtcABI = RenBTC.abi;
const renBtcContractAddress = RenBTC.networks["42"].address;

const wbtcABI = WBTC.abi;
const wbtcContractAddress = WBTC.networks["42"].address;

const renBtcAdapterAddress = RenBTCAdapter.networks["42"].address;

class SimpleComponent extends Component {
    state = {
        amount: 0,
        sendToken: 'btc',
        receiveToken: '',
        receiveBtcAddress: '',
        message: "",
        error: "",
        address: "",
        gatewayJS: new GatewayJS("testnet"),
    }

    componentDidMount = async () => {
        let web3Provider;
        console.log("MultiBtcWrapper", mwbContractAddress);
        console.log("RenBTCAdapter", renBtcAdapterAddress);

        // Initialize web3 (https://medium.com/coinmonks/web3-js-ethereum-javascript-api-72f7b22e2f0a)
        // Modern dApp browsers...
        if (window.ethereum) {
            web3Provider = window.ethereum;
            try {
            // Request account access
            await window.ethereum.enable();
            } catch (error) {
            // User denied account access...
            this.logError("Please allow access to your Web3 wallet.");
            return;
            }
        }
        // Legacy dApp browsers...
        else if (window.web3) {
            web3Provider = window.web3.currentProvider;
        }
        // If no injected web3 instance is detected, fall back to Ganache
        else {
            this.logError("Please install MetaMask!");
            return;
        }

        const address = web3Provider.selectedAddress;
        const web3 = new Web3(web3Provider);

        const networkID = await web3.eth.net.getId();
        if (networkID !== 42) {
            this.logError("Please set your network to Kovan.");
            return;
        }

        this.setState({ web3, address });

        this.recoverTransfers().catch(this.logError);
    }

    handleChange = event => {
        this.setState({
            [event.target.id]: event.target.value
        });

        if (event.target.id === "sendToken") {
            this.setState({ receiveToken: ""});
        }
    }

    render() {
        const { sendToken, receiveToken, message, error } = this.state;
        return (
            <div className="maindiv">
              <div className="div1">
                <h2> I want to send </h2>
              </div>

              <div className="div2">
                <input type="number" className="grey-text text-darken-3" style={{textAlign: "center", fontSize: "40px", borderBottom: "2px solid black"}} id="amount" value={this.state.amount} onChange={this.handleChange} />
              </div>

              <div className="div3">
                <ListComponent id={'sendToken'} disabledToken={''} onChange={this.handleChange} defaultValue={sendToken}/>
              </div>

              <div className="secondline">
                <div className="div4">
                  <h2> and receive </h2>
                </div>

                <div className="div5">
                  <ListComponent id={'receiveToken'} disabledToken={sendToken} onChange={this.handleChange} defaultValue={receiveToken}/>
                </div>

                <div className="div6">
                  <ReceiveAddress id={'receiveBtcAddress'} receiveToken={receiveToken} onChange={this.handleChange}/>
                </div>
              </div>

              <div className="buttoncenter">
                <button className="btn grey darken-3" onClick={this.swap}>Connect to Swap</button>
              </div>
              <p>{message}</p>
              {error ? <p style={{ color: "red" }}>{error}</p> : null}
            </div> 
        )
    }

    swap = async() => {
        const {value, sendToken, receiveToken, btcRecipient} = this.state;

        if (sendToken === "") {
            this.setState({ error: "please enter a valid send token"})
        }

        if (receiveToken === "") {
            this.setState({ error: "please enter a valid receive token"})
        }

        if ( sendToken === "btc" && btcRecipient === "") {
            this.setState({ error: "please enter a valid btcRecipient"})
            return;
        }

        if (sendToken === "mcbtc") {
            await this.withdraw(value, receiveToken);
            return;
        }
    
        if (receiveToken === "mcbtc") {
            await this.deposit(value, sendToken);
            return;
        }
    
        if (receiveToken === "btc" && sendToken === "wbtc") {
            await this.swapWBTCToBTC(value);
        } else if (receiveToken === "wbtc" && sendToken === "btc") {
            await this.swapBTCToWBTC(value);
        } else {
            this.setState({ error: `unsupported coin pair ${receiveToken}->${sendToken}` });
        }
    }
    
    swapWBTCToBTC = async(value) => {
        const { web3, address, gatewayJS, btcRecipient } = this.state;
    
        const amount = Math.floor(parseFloat(value) * (10 ** 8));
    
        const renBtcContract = new web3.eth.Contract(renBtcABI, renBtcContractAddress);
        const balance = await renBtcContract.methods.balanceOf(mwbContractAddress).call();
        if (balance < amount) {
            this.setState({ error: `insufficent BTC in the wrapper contract (${balance})` });
            return;
        }
    
        const wbtcContract = new web3.eth.Contract(wbtcABI, wbtcContractAddress);
        const allowance = await wbtcContract.methods.allowance(address, renBtcAdapterAddress).call();
        if (allowance < amount) {
            await wbtcContract.methods.approve(renBtcAdapterAddress, amount.toString()).send({ from: address });
        }
    
        // You can surround shiftOut with a try/catch to handle errors.
    
        await gatewayJS.open({
            // Send BTC from the Ethereum blockchain to the Bitcoin blockchain.
            // This is the reverse of shitIn.
            sendToken: GatewayJS.Tokens.BTC.Eth2Btc,
    
            // The contract we want to interact with
            sendTo: renBtcAdapterAddress,
    
            // The name of the function we want to call
            contractFn: "swapOut",
    
            // Arguments expected for calling `deposit`
            contractParams: [
            { name: "_fromBtcVariant", type: "address", value: wbtcContractAddress },
            { name: "_to", type: "bytes", value: "0x" + Buffer.from(btcRecipient).toString("hex") },
            { name: "_amount", type: "uint256", value: Math.floor(amount) },
            ],
    
            // Web3 provider for submitting burn to Ethereum
            web3Provider: web3.currentProvider,
        }).result();
    
        this.log(`Transferred ${amount} BTC to ${btcRecipient}.`);
        }
    
    swapBTCToWBTC = async(value) => {
        const { web3, gatewayJS } = this.state;
        const amount = parseFloat(value); // BTC
        console.log(amount);
    
        const wbtcContract = new web3.eth.Contract(renBtcABI, wbtcContractAddress);
        const balance = await wbtcContract.methods.balanceOf(mwbContractAddress).call();
        if (balance < amount) {
            this.setState({ error: `insufficent wBTC in the wrapper contract (${balance})` });
            return;
        }
    
        try {
            await gatewayJS.open({
            // Send BTC from the Bitcoin blockchain to the Ethereum blockchain.
            sendToken: GatewayJS.Tokens.BTC.Btc2Eth,
    
            // Amount of BTC we are sending (in Satoshis)
            suggestedAmount: Math.floor(amount * (10 ** 8)), // Convert to Satoshis
    
            // The contract we want to interact with
            sendTo: renBtcAdapterAddress,
    
            // The name of the function we want to call
            contractFn: "swapIn",
    
            // The nonce is used to guarantee a unique deposit address
            nonce: GatewayJS.utils.randomNonce(),
    
            // Arguments expected for calling `deposit`
            contractParams: [
                {
                name: "_msg",
                type: "bytes",
                value: web3.eth.abi.encodeParameters(["address"], [renBtcContractAddress]),
                }
            ],
    
            // Web3 provider for submitting mint to Ethereum
            web3Provider: web3.currentProvider,
            }).result();
            this.log(`Deposited ${amount} BTC.`);
        } catch (error) {
            // Handle error
            this.logError(error);
        }
    }   
    
    recoverTransfers = async() => {
        const { web3, gatewayJS } = this.state;
        // Load previous transfers from local storage
        const previousGateways = await gatewayJS.getGateways();
        // Resume each transfer
        for (const transfer of Array.from(previousGateways.values())) {
            gatewayJS
            .recoverTransfer(web3.currentProvider, transfer)
            .pause()
            .result()
            .catch(this.logError);
        }
    }
    
    
    deposit = async(value, coinType) => {
        switch (coinType) {
          case "btc":
              await this.depositBtc(value);
            break;
          case "wbtc":
              await this.depositWBTC(value);
            break;
          default:
              this.setState({ error: `unsupported coin type ${coinType}` });
            break;
        }
      }
    
      depositWBTC = async(value) => {
        const { web3, address } = this.state;
    
        const amount = Math.floor(parseFloat(value) * (10 ** 8));
    
        const contract = new web3.eth.Contract(wbtcABI, wbtcContractAddress);
    
        const allowance = await contract.methods.allowance(address, mwbContractAddress).call();
    
        if (allowance < amount) {
          await contract.methods.approve(mwbContractAddress, amount.toString()).send({ from: address });
        }
    
        const mwbContract = new web3.eth.Contract(mwbContractAddress, mwbABI);
        await mwbContract.methods.deposit(wbtcContractAddress, amount.toString()).send({ from: address });
      }
    
    depositBtc = async(value) => {
        const { web3, gatewayJS } = this.state;
        const amount = parseFloat(value); // BTC
        console.log(amount);
    
        try {
          await gatewayJS.open({
            // Send BTC from the Bitcoin blockchain to the Ethereum blockchain.
            sendToken: GatewayJS.Tokens.BTC.Btc2Eth,
    
            // Amount of BTC we are sending (in Satoshis)
            suggestedAmount: Math.floor(amount * (10 ** 8)), // Convert to Satoshis
    
            // The contract we want to interact with
            sendTo: renBtcAdapterAddress,
    
            // The name of the function we want to call
            contractFn: "deposit",
    
            // The nonce is used to guarantee a unique deposit address
            nonce: GatewayJS.utils.randomNonce(),
    
            // Arguments expected for calling `deposit`
            contractParams: [
              {
                name: "_msg",
                type: "bytes",
                value: web3.utils.fromAscii(`Depositing ${amount} BTC`),
              }
            ],
    
            // Web3 provider for submitting mint to Ethereum
            web3Provider: web3.currentProvider,
          }).result();
          this.log(`Deposited ${amount} BTC.`);
        } catch (error) {
          // Handle error
          this.logError(error);
        }
      }
    
    withdraw = async(value, coinType) => {
        switch (coinType) {
          case "btc":
              await this.withdrawBTC(value);
            break;
          case "wbtc":
              await this.withdrawWBTC(value);
            break;
          default:
              this.setState({ error: `unsupported coin type ${coinType}` });
            break;
        }
      }
    
      withdrawBTC = async(value) => {
            // console.log(value);
            const { web3, gatewayJS, address } = this.state;
    
            const amount = Math.floor(parseFloat(value) * (10 ** 8));
            const recipient = prompt("Enter BTC recipient:");
        
            const contract = new web3.eth.Contract(mwbABI, mwbContractAddress);
        
            const allowance = await contract.methods.allowance(address, renBtcAdapterAddress).call();
        
            if (allowance < amount) {
              await contract.methods.approve(renBtcAdapterAddress, amount.toString()).send({ from: address });
            }
        
            // You can surround shiftOut with a try/catch to handle errors.
        
            await gatewayJS.open({
              // Send BTC from the Ethereum blockchain to the Bitcoin blockchain.
              // This is the reverse of shitIn.
              sendToken: GatewayJS.Tokens.BTC.Eth2Btc,
        
              // The contract we want to interact with
              sendTo: renBtcAdapterAddress,
        
              // The name of the function we want to call
              contractFn: "withdraw",
        
              // Arguments expected for calling `deposit`
              contractParams: [
                { name: "_to", type: "bytes", value: "0x" + Buffer.from(recipient).toString("hex") },
                { name: "_amount", type: "uint256", value: Math.floor(amount) },
              ],
        
              // Web3 provider for submitting burn to Ethereum
              web3Provider: web3.currentProvider,
            }).result();
        
            this.log(`Withdrew ${amount} BTC to ${recipient}.`);    
      } 
    
      withdrawWBTC = async(value) => {
        const { web3, address } = this.state;
    
        const amount = Math.floor(parseFloat(value) * (10 ** 8));
    
        const mwbContract = new web3.eth.Contract(mwbContractAddress, mwbABI);
        await mwbContract.methods.withdraw(wbtcContractAddress, amount.toString()).send({ from: address });
      }

      logError = async(message) => {
          console.error(message);
      }
}

export default SimpleComponent

