// mainly taken out of https://github.com/jmcker/Peer-to-Peer-Cue-System
// I'd like to implement webrtc without needing something like peerjs once
// but this is just to get it out of the way for now

import { DataConnection, Peer } from "peerjs";

export const PEER_ID_PREFIX = "TRENCHESS_NO_WAY_THIS_COLLIDES_";

let lastPeerId: string;

let peer: Peer;
export const getPeer = () => {
  return peer;
}

let conn: DataConnection | null;
export const getDataConnection = () => {
  return conn;
};

export const clientInitialize = () => {
  return new Promise((resolve, reject) => {
    peer = new Peer({
      debug: 3,
    });

    peer.on('open', function () {
        // Workaround for peer.reconnect deleting previous id
        if (peer.id === null) {
            console.log('Received null id from peer open');
            // @ts-expect-error following an example
            peer.id = lastPeerId;
        } else {
            lastPeerId = peer.id;
        }
        resolve(peer);
        console.log('ID: ' + peer.id);
    });
    peer.on('connection', function (c) {
        // Disallow incoming connections
        c.on('open', function() {
            c.send("client does not accept incoming connections");
            setTimeout(function() { c.close(); }, 500);
        });
    });
    peer.on('disconnected', function () {
        console.log('Connection lost. Please reconnect');

        // @ts-expect-error following an example
        peer.id = lastPeerId;
        // @ts-expect-error following an example
        peer._lastServerId = lastPeerId;
        peer.reconnect();
    });
    peer.on('close', function() {
        conn = null;
        console.log('Connection destroyed');
    });
    peer.on('error', function (err) {
        console.log(err);
        alert('' + err);
        reject(err);
    });
  });
}

export const clientConnect = (hostId: string) => {
  return new Promise((resolve, reject) => {
    if (conn) {
      conn.close();
    }
  
    // Create connection to destination peer specified in the input field
    conn = peer.connect(PEER_ID_PREFIX + hostId, {
        reliable: true
    });
  
    conn.on('open', function () {
      console.log("Connected to: " + conn?.peer);
      resolve(conn);
    });
    
    conn.on("error", (err) => {
      console.error(err);
      reject(err);
    });
  });
}

export const hostInitialize = (peerId: string) => {
  return new Promise((resolve, reject) => {
    // Create own peer object with connection to shared PeerJS server
    peer = new Peer(PEER_ID_PREFIX + peerId, {
      debug: 3
    });

    peer.on('open', function () {
        if (peer.id === null) {
            console.log('Received null id from peer open');
            // @ts-expect-error following an example
            peer.id = lastPeerId;
          } else {
            console.log({ lastPeerId, peerId: peer.id })
            lastPeerId = peer.id;
        }
        
        resolve(peer);

        console.log('ID: ' + peer.id);
    });
    peer.on('disconnected', function () {
        console.log('Connection lost. Please reconnect');

        // Workaround for peer.reconnect deleting previous id
        // @ts-expect-error following an example
        peer.id = lastPeerId;
        // @ts-expect-error following an example
        peer._lastServerId = lastPeerId;
        peer.reconnect();
    });
    peer.on('close', function() {
        conn = null;
        console.log('Connection destroyed');
    });
    peer.on('error', function (err) {
        console.log(err);
        alert('' + err);
        reject(err);
    });
  });
}

export const setupHostConnection = () => {
  return new Promise((resolve, reject) => {
    peer.on('connection', function (c) {
      console.log(c, "ON CONNECTION!!");
      // Allow only a single connection
      if (conn && conn.open) {
          c.on('open', function() {
              c.send("Already connected to another client");
              console.log("ALREADY CONNECTED, DISCONNECT!!");
              setTimeout(function() { c.close(); });
          });
          return;
      }

      conn = c;
      console.log("Connected to: " + conn.peer);
      resolve(conn);
    });
    
    peer.on("error", (err) => { console.error(err); reject(err) });
  });
}
