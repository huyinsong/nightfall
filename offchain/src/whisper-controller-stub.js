/**
This module implements a dummy Whisper protocol. It was created so that the codebase
can be developed with Ganache-cli (which doesn't support Whisper).  If used instead
of whisper-controller.js it will respond in exactly the same way but does not require
and Ethereum client that supports Whisper to be running.  It only works for users on
the same node server though (nothing gets passed through the blockchain).
@author Westlad
@module whisper-controller-stub
*/

import Utils from 'zkp-utils';
import EventEmitter from 'events';

const utils = Utils('/app/stats-config/stats.json');

class MyEmitter extends EventEmitter {}
const em = new MyEmitter();

const TRANSFER_TOPIC = '0xeca7945f';

const wpk = {};

/**
function to generate Whisper keys and return them
@param {object} id - the 'identity' of the Whisper user.  Contains addresses, names, key material
as a minimum it must contain an Etherium address and a name string
@returns {object} the users identity, with the Whisper key-pair added
*/
export async function generateWhisperKeys(id) {
  if (id.address === undefined)
    throw new Error('no valid Ethereum Address has been set for this party');

  const shhIdentity = utils.strip0x(await utils.rndHex(32)); // just use a random number

  wpk[shhIdentity] = await utils.rndHex(65); // save a corresponding random 'public key'\
  const returnPubKey = wpk[shhIdentity];
  return { shhIdentity, returnPubKey };
}

/**
Function to return the Whisper public key, given an shhIdentity generated by the
generateWhisperKeys function above
@param {object} id - the 'identity' of the Whisper user.  Contains addresses, names, key material
as a minimum it must contain the Whisper shhIdenity
*/
export async function getWhisperPublicKey(id) {
  if (id.shhIdentity === undefined) throw new Error('Whisper identity not found in id object');
  return wpk[id.shhIdentity];
}

/**
function to subscribe to whisper messages.  You need a Whisper key pair for this to work
@param {object} idReceiver - the 'identity' of the Whisper user.  Contains addresses, names, key material.
As a minimum it must contain the Whisper key pair.
@param {string} topic - the topic to subscribe to
@param {function} listener - callback that will be called when a topical message is received
This version returns the raw hex Whisper payload
*/
export async function subscribe() {
  return new Error('This interface isnt implemented in the stub');
}

/**
function to subscribe to whisper messages.  You need a Whisper key pair for this to work.
This function expects messages which encode a javascript object and will attempt to
decode them, returning the original object
@param {object} idReceiver - the 'identity' of the Whisper user.  Contains addresses, names, key material.
As a minimum it must contain the Whisper key pair.
@param {string} topic - the topic to subscribe to
@param {object} userData - holds user's JWT token to enable calls through the API gateway
on the user's behalf
@param {function} listener - callback that will be called when a topical message is received
This version will return a Javascript object as the payload (assuming sendObject was used to send
the object)
*/
export async function subscribeObject(idReceiver, topic = TRANSFER_TOPIC, userData, listener) {
  // const idReceiver = {..._idReceiver}
  if (utils.strip0x(topic).length !== 8) throw new Error('Whisper topic must be 4 bytes long');
  if (idReceiver.shhIdentity === undefined)
    throw new Error(
      'no valid Whisper key pair was found.  Please generate these before subscribing',
    );
  em.on(topic + wpk[idReceiver.shhIdentity], msg => {
    listener(msg, userData);
  });
  return em;
}

/**
function to send a Whisper message, containing an encoded javascript object.
This function will do the encoding Note that
the message is delayed for 3 seconds.  This is for rare occassions when a user sends
messages to themselves.  It allows time for other code to transistion from 'transmit'
to 'receive'.  It's a little crude and 3s is overkill but will do for now.
@param {string} name - the name of the receipient (used to look up their Whisper public key)
@param {string} message - the javascript object to be sent
@param {object} idSender - the 'identity' of the sender (used to extract Whisper private key to sign the message)
@param {bytes4} topic - the topic to post to (four bytes)
@param {string} pkReceiver - the receipient's public key
*/
export async function sendObject(message, idSender, pkReceiver, topic = TRANSFER_TOPIC) {
  if (utils.strip0x(topic).length !== 8) throw new Error('Whisper topic must be 4 bytes long');
  if (idSender.shhIdentity === undefined)
    throw new Error('Whisper identity not found in id object');
  const msg = {
    sig: wpk[idSender.shhIdentity],
    ttl: 10,
    timestamp: Date.now(),
    topic: utils.ensure0x(topic),
    payload: message,
    padding:
      '0x01bf61612e35eaf7c6c17d4ab004b6e109bf8e6c15098a5072eab5a9a550ee618280f32826dab12e64114d8b84ffef6da1f7e374efb5e90c6a0c2da7ade276899f88c857cc79840ec79445e37b784b6c362f0e2520045659fe15679be49ad32b1666e65dbbeeec3ca0cb622049165c9d4ed92110c87782bc149c4ddd74de5ea1eded9102f44ffcfba8724b04d935f6a238d894851b7e9c74e2c59e6c76068344feba96fd80ded546ecdada63c098a3a4f28e7f0cc7',
    pow: 0.526478149100257,
    hash: '0x2b30567792f5760e7a415583e7c98bb01b50451883ea6ed1c3ffa4bc1881f7c2',
    ReceiverPublicKey: utils.ensure0x(pkReceiver),
  };
  setTimeout(() => {
    em.emit(topic + utils.ensure0x(pkReceiver), msg);
  }, 3000); // delaying message send
}
