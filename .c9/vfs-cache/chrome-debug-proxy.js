!function(){if(!global.define){
var fs=require("fs"),path=require("path"),Module=require("module"),fp=Module._findPath
Module._findPath=function(request,paths){if(Module._cache[request])return request
var id=path.resolve(paths[0],request)
return Module._cache[id]?id:fp(request,paths)}
var moduleStack=[],defaultCompile=module.constructor.prototype._compile
module.constructor.prototype._compile=function(content,filename){moduleStack.push(this)
try{return defaultCompile.call(this,content,filename)}finally{moduleStack.pop()}},
global.define=function(id,injects,factory){
var DEFAULT_INJECTS=["require","exports","module"],currentModule=moduleStack[moduleStack.length-1],mod=currentModule||module.parent||require.main

if(1===arguments.length?(factory=id,injects=DEFAULT_INJECTS,id=null):2===arguments.length&&(factory=injects,
injects=id,id=null),0==injects.length&&(injects=DEFAULT_INJECTS),"string"==typeof id&&id!==mod.id){
var fullId=path.resolve(__filename,id)
mod=new Module(fullId,mod),mod.filename=fullId,Module._cache[id]=Module._cache[fullId]=mod}
var req=function(module,relativeId,callback){
if(Array.isArray(relativeId))return callback.apply(this,relativeId.map(req))
var prefix,chunks=relativeId.split("!")
chunks.length>=2&&(prefix=chunks[0],relativeId=chunks.slice(1).join("!"))
var fileName=Module._resolveFilename(relativeId,module)
return Array.isArray(fileName)&&(fileName=fileName[0]),prefix&&-1!==prefix.indexOf("text")?fs.readFileSync(fileName,"utf8"):require(fileName)
}.bind(this,mod)
if(id=mod.id,"function"!=typeof factory)return mod.exports=factory
var returned=factory.apply(mod.exports,injects.map(function(injection){switch(injection){
case"require":return req
case"exports":return mod.exports
case"module":return mod
default:return req(injection)}}))
returned&&(mod.exports=returned)}}}()


define("safe-buffer",[],function(require,exports,module){function copyProps(src,dst){
for(var key in src)dst[key]=src[key]}function SafeBuffer(arg,encodingOrOffset,length){
return Buffer(arg,encodingOrOffset,length)}var buffer=require("buffer"),Buffer=buffer.Buffer
Buffer.from&&Buffer.alloc&&Buffer.allocUnsafe&&Buffer.allocUnsafeSlow?module.exports=buffer:(copyProps(buffer,exports),
exports.Buffer=SafeBuffer),
copyProps(Buffer,SafeBuffer),SafeBuffer.from=function(arg,encodingOrOffset,length){
if("number"==typeof arg)throw new TypeError("Argument must not be a number")
return Buffer(arg,encodingOrOffset,length)},SafeBuffer.alloc=function(size,fill,encoding){
if("number"!=typeof size)throw new TypeError("Argument must be a number")
var buf=Buffer(size)
return void 0!==fill?"string"==typeof encoding?buf.fill(fill,encoding):buf.fill(fill):buf.fill(0),
buf},SafeBuffer.allocUnsafe=function(size){
if("number"!=typeof size)throw new TypeError("Argument must be a number")
return Buffer(size)},SafeBuffer.allocUnsafeSlow=function(size){
if("number"!=typeof size)throw new TypeError("Argument must be a number")
return buffer.SlowBuffer(size)}})


define("async-limiter",[],function(require,exports,module){"use strict"
function Queue(options){if(!(this instanceof Queue))return new Queue(options)
options=options||{},this.concurrency=options.concurrency||1/0,this.pending=0,this.jobs=[],
this.cbs=[],this._done=done.bind(this)}function done(){this.pending--,this._run()}
["push","unshift","splice"].forEach(function(method){Queue.prototype[method]=function(){
var methodResult=Array.prototype[method].apply(this.jobs,arguments)
return this._run(),methodResult}}),Object.defineProperty(Queue.prototype,"length",{get:function(){
return this.pending+this.jobs.length}}),Queue.prototype._run=function(){
if(this.pending!==this.concurrency){if(this.jobs.length){var job=this.jobs.shift()
this.pending++,job(this._done),this._run()}if(0===this.pending)for(;0!==this.cbs.length;){
var cb=this.cbs.pop()
process.nextTick(cb)}}},Queue.prototype.onDone=function(cb){
"function"==typeof cb&&(this.cbs.push(cb),this._run())},module.exports=Queue})


define("ws/lib/buffer-util",[],function(require,exports,module){"use strict"
var safeBuffer=require("safe-buffer"),Buffer=safeBuffer.Buffer,concat=function(list,totalLength){
for(var target=Buffer.allocUnsafe(totalLength),offset=0,i=0;i<list.length;i++){var buf=list[i]
buf.copy(target,offset),offset+=buf.length}return target}
try{var bufferUtil=require("bufferutil")
module.exports=Object.assign({concat:concat},bufferUtil.BufferUtil||bufferUtil)}catch(e){
var mask=function(source,mask,output,offset,length){
for(var i=0;i<length;i++)output[offset+i]=source[i]^mask[3&i]},unmask=function(buffer,mask){
for(var length=buffer.length,i=0;i<length;i++)buffer[i]^=mask[3&i]}
module.exports={concat:concat,mask:mask,unmask:unmask}}})


define("ws/lib/permessage-deflate",[],function(require,exports,module){"use strict"
function deflateOnData(chunk){this[kBuffers].push(chunk),this[kTotalLength]+=chunk.length}
function inflateOnData(chunk){
if(this[kTotalLength]+=chunk.length,this[kOwner]._maxPayload<1||this[kTotalLength]<=this[kOwner]._maxPayload)return void this[kBuffers].push(chunk)

this[kError]=new RangeError("Max payload size exceeded"),this[kError].closeCode=1009,
this.removeListener("data",inflateOnData),this.reset()}function inflateOnError(err){
this[kOwner]._inflate=null,this[kCallback](err)}
var zlibLimiter,safeBuffer=require("safe-buffer"),Limiter=require("async-limiter"),zlib=require("zlib"),bufferUtil=require("./buffer-util"),Buffer=safeBuffer.Buffer,TRAILER=Buffer.from([0,0,255,255]),EMPTY_BLOCK=Buffer.from([0]),kWriteInProgress=Symbol("write-in-progress"),kPendingClose=Symbol("pending-close"),kTotalLength=Symbol("total-length"),kCallback=Symbol("callback"),kBuffers=Symbol("buffers"),kError=Symbol("error"),kOwner=Symbol("owner"),PerMessageDeflate=function(){
function PerMessageDeflate(options,isServer,maxPayload){if(this._maxPayload=0|maxPayload,
this._options=options||{},
this._threshold=void 0!==this._options.threshold?this._options.threshold:1024,
this._isServer=!!isServer,this._deflate=null,this._inflate=null,this.params=null,!zlibLimiter){
var concurrency=void 0!==this._options.concurrencyLimit?this._options.concurrencyLimit:10
zlibLimiter=new Limiter({concurrency:concurrency})}}
return Object.defineProperty(PerMessageDeflate,"extensionName",{get:function(){
return"permessage-deflate"},enumerable:!0,configurable:!0
}),PerMessageDeflate.prototype.offer=function(){var params={}
return this._options.serverNoContextTakeover&&(params.server_no_context_takeover=!0),
this._options.clientNoContextTakeover&&(params.client_no_context_takeover=!0),
this._options.serverMaxWindowBits&&(params.server_max_window_bits=this._options.serverMaxWindowBits),
this._options.clientMaxWindowBits?params.client_max_window_bits=this._options.clientMaxWindowBits:null==this._options.clientMaxWindowBits&&(params.client_max_window_bits=!0),
params},PerMessageDeflate.prototype.accept=function(configurations){
return configurations=this.normalizeParams(configurations),
this.params=this._isServer?this.acceptAsServer(configurations):this.acceptAsClient(configurations),
this.params},PerMessageDeflate.prototype.cleanup=function(){
this._inflate&&(this._inflate[kWriteInProgress]?this._inflate[kPendingClose]=!0:(this._inflate.close(),
this._inflate=null)),
this._deflate&&(this._deflate[kWriteInProgress]?this._deflate[kPendingClose]=!0:(this._deflate.close(),
this._deflate=null))},PerMessageDeflate.prototype.acceptAsServer=function(offers){
var opts=this._options,accepted=offers.find(function(params){
return!(!1===opts.serverNoContextTakeover&&params.server_no_context_takeover||params.server_max_window_bits&&(!1===opts.serverMaxWindowBits||"number"==typeof opts.serverMaxWindowBits&&opts.serverMaxWindowBits>params.server_max_window_bits)||"number"==typeof opts.clientMaxWindowBits&&!params.client_max_window_bits)
})
if(!accepted)throw new Error("None of the extension offers can be accepted")
return opts.serverNoContextTakeover&&(accepted.server_no_context_takeover=!0),opts.clientNoContextTakeover&&(accepted.client_no_context_takeover=!0),
"number"==typeof opts.serverMaxWindowBits&&(accepted.server_max_window_bits=opts.serverMaxWindowBits),
"number"==typeof opts.clientMaxWindowBits?accepted.client_max_window_bits=opts.clientMaxWindowBits:!0!==accepted.client_max_window_bits&&!1!==opts.clientMaxWindowBits||delete accepted.client_max_window_bits,
accepted},PerMessageDeflate.prototype.acceptAsClient=function(response){var params=response[0]
if(!1===this._options.clientNoContextTakeover&&params.client_no_context_takeover)throw new Error('Unexpected parameter "client_no_context_takeover"')

if(params.client_max_window_bits){
if(!1===this._options.clientMaxWindowBits||"number"==typeof this._options.clientMaxWindowBits&&params.client_max_window_bits>this._options.clientMaxWindowBits)throw new Error('Unexpected or invalid parameter "client_max_window_bits"')
}else"number"==typeof this._options.clientMaxWindowBits&&(params.client_max_window_bits=this._options.clientMaxWindowBits)

return params},PerMessageDeflate.prototype.normalizeParams=function(configurations){var _this=this
return configurations.forEach(function(params){Object.keys(params).forEach(function(key){
var value=params[key]
if(value.length>1)throw new Error('Parameter "'+key+'" must have only a single value')
if(value=value[0],"client_max_window_bits"===key){if(!0!==value){var num=+value
if(!Number.isInteger(num)||num<8||num>15)throw new TypeError('Invalid value for parameter "'+key+'": '+value)

value=num
}else if(!_this._isServer)throw new TypeError('Invalid value for parameter "'+key+'": '+value)
}else if("server_max_window_bits"===key){var num=+value
if(!Number.isInteger(num)||num<8||num>15)throw new TypeError('Invalid value for parameter "'+key+'": '+value)

value=num}else{
if("client_no_context_takeover"!==key&&"server_no_context_takeover"!==key)throw new Error('Unknown parameter "'+key+'"')

if(!0!==value)throw new TypeError('Invalid value for parameter "'+key+'": '+value)}params[key]=value
})}),configurations},PerMessageDeflate.prototype.decompress=function(data,fin,callback){
var _this=this
zlibLimiter.push(function(done){_this._decompress(data,fin,function(err,result){done(),
callback(err,result)})})},PerMessageDeflate.prototype.compress=function(data,fin,callback){
var _this=this
zlibLimiter.push(function(done){_this._compress(data,fin,function(err,result){done(),
callback(err,result)})})},PerMessageDeflate.prototype._decompress=function(data,fin,callback){
var _this=this,endpoint=this._isServer?"client":"server"
if(!this._inflate){
var key=endpoint+"_max_window_bits",windowBits="number"!=typeof this.params[key]?zlib.Z_DEFAULT_WINDOWBITS:this.params[key]

this._inflate=zlib.createInflateRaw(Object.assign({},this._options.zlibInflateOptions,{
windowBits:windowBits})),this._inflate[kTotalLength]=0,this._inflate[kBuffers]=[],
this._inflate[kOwner]=this,
this._inflate.on("error",inflateOnError),this._inflate.on("data",inflateOnData)}
this._inflate[kCallback]=callback,this._inflate[kWriteInProgress]=!0,this._inflate.write(data),
fin&&this._inflate.write(TRAILER),this._inflate.flush(function(){var err=_this._inflate[kError]
if(err)return _this._inflate.close(),_this._inflate=null,void callback(err)
var data=bufferUtil.concat(_this._inflate[kBuffers],_this._inflate[kTotalLength])
fin&&_this.params[endpoint+"_no_context_takeover"]||_this._inflate[kPendingClose]?(_this._inflate.close(),
_this._inflate=null):(_this._inflate[kWriteInProgress]=!1,_this._inflate[kTotalLength]=0,
_this._inflate[kBuffers]=[]),callback(null,data)})
},PerMessageDeflate.prototype._compress=function(data,fin,callback){var _this=this
if(!data||0===data.length)return void process.nextTick(callback,null,EMPTY_BLOCK)
var endpoint=this._isServer?"server":"client"
if(!this._deflate){
var key=endpoint+"_max_window_bits",windowBits="number"!=typeof this.params[key]?zlib.Z_DEFAULT_WINDOWBITS:this.params[key]

this._deflate=zlib.createDeflateRaw(Object.assign({memLevel:this._options.memLevel,
level:this._options.level},this._options.zlibDeflateOptions,{windowBits:windowBits})),
this._deflate[kTotalLength]=0,this._deflate[kBuffers]=[],this._deflate.on("data",deflateOnData)}
this._deflate[kWriteInProgress]=!0,
this._deflate.write(data),this._deflate.flush(zlib.Z_SYNC_FLUSH,function(){
var data=bufferUtil.concat(_this._deflate[kBuffers],_this._deflate[kTotalLength])
fin&&(data=data.slice(0,data.length-4)),fin&&_this.params[endpoint+"_no_context_takeover"]||_this._deflate[kPendingClose]?(_this._deflate.close(),
_this._deflate=null):(_this._deflate[kWriteInProgress]=!1,_this._deflate[kTotalLength]=0,
_this._deflate[kBuffers]=[]),callback(null,data)})},PerMessageDeflate}()
module.exports=PerMessageDeflate})


var __extends=this&&this.__extends||function(){var extendStatics=function(d,b){
return(extendStatics=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(d,b){
d.__proto__=b}||function(d,b){for(var p in b)b.hasOwnProperty(p)&&(d[p]=b[p])})(d,b)}
return function(d,b){function __(){this.constructor=d}
extendStatics(d,b),d.prototype=null===b?Object.create(b):(__.prototype=b.prototype,new __)}}()
define("ws/lib/event-target",[],function(require,exports,module){"use strict"
var Event=function(){function Event(type,target){this.target=target,this.type=type}return Event
}(),MessageEvent=function(_super){function MessageEvent(data,target){
var _this=_super.call(this,"message",target)||this
return _this.data=data,_this}return __extends(MessageEvent,_super),MessageEvent
}(Event),CloseEvent=function(_super){function CloseEvent(code,reason,target){
var _this=_super.call(this,"close",target)||this
return _this.wasClean=target._closeFrameReceived&&target._closeFrameSent,_this.reason=reason,
_this.code=code,_this}return __extends(CloseEvent,_super),CloseEvent
}(Event),OpenEvent=function(_super){function OpenEvent(target){
return _super.call(this,"open",target)||this}return __extends(OpenEvent,_super),OpenEvent
}(Event),ErrorEvent=function(_super){function ErrorEvent(error,target){
var _this=_super.call(this,"error",target)||this
return _this.message=error.message,_this.error=error,_this}return __extends(ErrorEvent,_super),
ErrorEvent}(Event),EventTarget={addEventListener:function(method,listener){function onMessage(data){
listener.call(this,new MessageEvent(data,this))}function onClose(code,message){
listener.call(this,new CloseEvent(code,message,this))}function onError(error){
listener.call(this,new ErrorEvent(error,this))}function onOpen(){
listener.call(this,new OpenEvent(this))}
"function"==typeof listener&&("message"===method?(onMessage._listener=listener,
this.on(method,onMessage)):"close"===method?(onClose._listener=listener,
this.on(method,onClose)):"error"===method?(onError._listener=listener,
this.on(method,onError)):"open"===method?(onOpen._listener=listener,
this.on(method,onOpen)):this.on(method,listener))},removeEventListener:function(method,listener){
for(var listeners=this.listeners(method),i=0;i<listeners.length;i++)listeners[i]!==listener&&listeners[i]._listener!==listener||this.removeListener(method,listeners[i])
}}
module.exports=EventTarget})


define("ws/lib/extension",[],function(require,exports,module){"use strict"
function push(dest,name,elem){
Object.prototype.hasOwnProperty.call(dest,name)?dest[name].push(elem):dest[name]=[elem]}
function parse(header){var offers={}
if(void 0===header||""===header)return offers
for(var extensionName,paramName,params={},mustUnescape=!1,isEscaping=!1,inQuotes=!1,start=-1,end=-1,i=0;i<header.length;i++){
var code=header.charCodeAt(i)
if(void 0===extensionName)if(-1===end&&1===tokenChars[code])-1===start&&(start=i)
else if(32===code||9===code)-1===end&&-1!==start&&(end=i)
else{if(59!==code&&44!==code)throw new SyntaxError("Unexpected character at index "+i)
if(-1===start)throw new SyntaxError("Unexpected character at index "+i);-1===end&&(end=i)
var name=header.slice(start,end)
44===code?(push(offers,name,params),params={}):extensionName=name,start=end=-1
}else if(void 0===paramName)if(-1===end&&1===tokenChars[code])-1===start&&(start=i)
else if(32===code||9===code)-1===end&&-1!==start&&(end=i)
else if(59===code||44===code){
if(-1===start)throw new SyntaxError("Unexpected character at index "+i);-1===end&&(end=i),
push(params,header.slice(start,end),!0),44===code&&(push(offers,extensionName,params),params={},
extensionName=void 0),start=end=-1}else{
if(61!==code||-1===start||-1!==end)throw new SyntaxError("Unexpected character at index "+i)
paramName=header.slice(start,i),start=end=-1}else if(isEscaping){
if(1!==tokenChars[code])throw new SyntaxError("Unexpected character at index "+i)
;-1===start?start=i:mustUnescape||(mustUnescape=!0),isEscaping=!1
}else if(inQuotes)if(1===tokenChars[code])-1===start&&(start=i)
else if(34===code&&-1!==start)inQuotes=!1,end=i
else{if(92!==code)throw new SyntaxError("Unexpected character at index "+i)
isEscaping=!0}else if(34===code&&61===header.charCodeAt(i-1))inQuotes=!0
else if(-1===end&&1===tokenChars[code])-1===start&&(start=i)
else if(-1===start||32!==code&&9!==code){
if(59!==code&&44!==code)throw new SyntaxError("Unexpected character at index "+i)
if(-1===start)throw new SyntaxError("Unexpected character at index "+i);-1===end&&(end=i)
var value=header.slice(start,end)
mustUnescape&&(value=value.replace(/\\/g,""),mustUnescape=!1),push(params,paramName,value),
44===code&&(push(offers,extensionName,params),params={},extensionName=void 0),paramName=void 0,
start=end=-1}else-1===end&&(end=i)}
if(-1===start||inQuotes)throw new SyntaxError("Unexpected end of input");-1===end&&(end=i)
var token=header.slice(start,end)
return void 0===extensionName?push(offers,token,{}):(void 0===paramName?push(params,token,!0):mustUnescape?push(params,paramName,token.replace(/\\/g,"")):push(params,paramName,token),
push(offers,extensionName,params)),offers}function format(extensions){
return Object.keys(extensions).map(function(extension){var configurations=extensions[extension]
return Array.isArray(configurations)||(configurations=[configurations]),configurations.map(function(params){
return[extension].concat(Object.keys(params).map(function(k){var values=params[k]
return Array.isArray(values)||(values=[values]),values.map(function(v){return!0===v?k:k+"="+v
}).join("; ")})).join("; ")}).join(", ")}).join(", ")}
var tokenChars=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,1,0,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1,0]

module.exports={format:format,parse:parse}})


define("ws/lib/constants",[],function(require,exports,module){"use strict"
var safeBuffer=require("safe-buffer"),Buffer=safeBuffer.Buffer
exports.BINARY_TYPES=["nodebuffer","arraybuffer","fragments"],exports.GUID="258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
exports.EMPTY_BUFFER=Buffer.alloc(0),exports.NOOP=function(){}})


define("ws/lib/validation",[],function(require,exports,module){"use strict"
try{var isValidUTF8=require("utf-8-validate")
exports.isValidUTF8="object"==typeof isValidUTF8?isValidUTF8.Validation.isValidUTF8:isValidUTF8
}catch(e){exports.isValidUTF8=function(){return!0}}exports.isValidStatusCode=function(code){
return code>=1e3&&code<=1013&&1004!==code&&1005!==code&&1006!==code||code>=3e3&&code<=4999}})


define("ws/lib/receiver",[],function(require,exports,module){"use strict"
function toBuffer(fragments,messageLength){
return 1===fragments.length?fragments[0]:fragments.length>1?bufferUtil.concat(fragments,messageLength):constants.EMPTY_BUFFER
}function toArrayBuffer(buf){
return 0===buf.byteOffset&&buf.byteLength===buf.buffer.byteLength?buf.buffer:buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength)
}
var safeBuffer=require("safe-buffer"),PerMessageDeflate=require("./permessage-deflate"),bufferUtil=require("./buffer-util"),validation=require("./validation"),constants=require("./constants"),Buffer=safeBuffer.Buffer,GET_INFO=0,GET_PAYLOAD_LENGTH_16=1,GET_PAYLOAD_LENGTH_64=2,GET_MASK=3,GET_DATA=4,INFLATING=5,Receiver=function(){
function Receiver(extensions,maxPayload,binaryType){
this._binaryType=binaryType||constants.BINARY_TYPES[0],this._extensions=extensions||{},
this._maxPayload=0|maxPayload,this._bufferedBytes=0,this._buffers=[],this._compressed=!1,
this._payloadLength=0,this._fragmented=0,this._masked=!1,this._fin=!1,this._mask=null,
this._opcode=0,this._totalPayloadLength=0,this._messageLength=0,this._fragments=[],
this._cleanupCallback=null,this._isCleaningUp=!1,this._hadError=!1,this._loop=!1,
this.add=this.add.bind(this),this.onmessage=null,this.onclose=null,this.onerror=null,
this.onping=null,this.onpong=null,this._state=GET_INFO}
return Receiver.prototype.consume=function(n){if(this._bufferedBytes<n)return this._loop=!1,
this._isCleaningUp&&this.cleanup(this._cleanupCallback),null
if(this._bufferedBytes-=n,n===this._buffers[0].length)return this._buffers.shift()
if(n<this._buffers[0].length){var buf=this._buffers[0]
return this._buffers[0]=buf.slice(n),buf.slice(0,n)}var dst=Buffer.allocUnsafe(n)
do{var buf=this._buffers[0]
n>=buf.length?this._buffers.shift().copy(dst,dst.length-n):(buf.copy(dst,dst.length-n,0,n),
this._buffers[0]=buf.slice(n)),n-=buf.length}while(n>0)
return dst},Receiver.prototype.add=function(chunk){this._bufferedBytes+=chunk.length,
this._buffers.push(chunk),this.startLoop()},Receiver.prototype.startLoop=function(){this._loop=!0
do{switch(this._state){case GET_INFO:this.getInfo()
break
case GET_PAYLOAD_LENGTH_16:this.getPayloadLength16()
break
case GET_PAYLOAD_LENGTH_64:this.getPayloadLength64()
break
case GET_MASK:this.getMask()
break
case GET_DATA:this.getData()
break
default:this._loop=!1}}while(this._loop)},Receiver.prototype.getInfo=function(){
var buf=this.consume(2)
if(null!==buf){
if(0!=(48&buf[0]))return void this.error(new RangeError("Invalid WebSocket frame: RSV2 and RSV3 must be clear"),1002)

var compressed=64==(64&buf[0])
if(compressed&&!this._extensions[PerMessageDeflate.extensionName])return void this.error(new RangeError("Invalid WebSocket frame: RSV1 must be clear"),1002)

if(this._fin=128==(128&buf[0]),this._opcode=15&buf[0],this._payloadLength=127&buf[1],
0===this._opcode){
if(compressed)return void this.error(new RangeError("Invalid WebSocket frame: RSV1 must be clear"),1002)

if(!this._fragmented)return void this.error(new RangeError("Invalid WebSocket frame: invalid opcode 0"),1002)

this._opcode=this._fragmented}else if(1===this._opcode||2===this._opcode){
if(this._fragmented)return void this.error(new RangeError("Invalid WebSocket frame: invalid opcode "+this._opcode),1002)

this._compressed=compressed}else{
if(!(this._opcode>7&&this._opcode<11))return void this.error(new RangeError("Invalid WebSocket frame: invalid opcode "+this._opcode),1002)

if(!this._fin)return void this.error(new RangeError("Invalid WebSocket frame: FIN must be set"),1002)

if(compressed)return void this.error(new RangeError("Invalid WebSocket frame: RSV1 must be clear"),1002)

if(this._payloadLength>125)return void this.error(new RangeError("Invalid WebSocket frame: invalid payload length "+this._payloadLength),1002)
}this._fin||this._fragmented||(this._fragmented=this._opcode),this._masked=128==(128&buf[1]),
126===this._payloadLength?this._state=GET_PAYLOAD_LENGTH_16:127===this._payloadLength?this._state=GET_PAYLOAD_LENGTH_64:this.haveLength()
}},Receiver.prototype.getPayloadLength16=function(){var buf=this.consume(2)
null!==buf&&(this._payloadLength=buf.readUInt16BE(0,!0),this.haveLength())
},Receiver.prototype.getPayloadLength64=function(){var buf=this.consume(8)
if(null!==buf){var num=buf.readUInt32BE(0,!0)
if(num>Math.pow(2,21)-1)return void this.error(new RangeError("Unsupported WebSocket frame: payload length > 2^53 - 1"),1009)

this._payloadLength=num*Math.pow(2,32)+buf.readUInt32BE(4,!0),this.haveLength()}},
Receiver.prototype.haveLength=function(){
this._opcode<8&&this.maxPayloadExceeded(this._payloadLength)||(this._masked?this._state=GET_MASK:this._state=GET_DATA)
},Receiver.prototype.getMask=function(){
this._mask=this.consume(4),null!==this._mask&&(this._state=GET_DATA)
},Receiver.prototype.getData=function(){var data=constants.EMPTY_BUFFER
if(this._payloadLength){if(null===(data=this.consume(this._payloadLength)))return
this._masked&&bufferUtil.unmask(data,this._mask)}
this._opcode>7?this.controlMessage(data):this._compressed?(this._state=INFLATING,
this.decompress(data)):this.pushFragment(data)&&this.dataMessage()
},Receiver.prototype.decompress=function(data){var _this=this
this._extensions[PerMessageDeflate.extensionName].decompress(data,this._fin,function(err,buf){
if(err)return void _this.error(err,1009===err.closeCode?1009:1007)
_this.pushFragment(buf)&&_this.dataMessage(),_this.startLoop()})
},Receiver.prototype.dataMessage=function(){if(this._fin){
var messageLength=this._messageLength,fragments=this._fragments
if(this._totalPayloadLength=0,this._messageLength=0,this._fragmented=0,this._fragments=[],
2===this._opcode){var data
data="nodebuffer"===this._binaryType?toBuffer(fragments,messageLength):"arraybuffer"===this._binaryType?toArrayBuffer(toBuffer(fragments,messageLength)):fragments,
this.onmessage(data)}else{var buf=toBuffer(fragments,messageLength)
if(!validation.isValidUTF8(buf))return void this.error(new Error("Invalid WebSocket frame: invalid UTF-8 sequence"),1007)

this.onmessage(buf.toString())}}this._state=GET_INFO
},Receiver.prototype.controlMessage=function(data){
if(8!==this._opcode)9===this._opcode?this.onping(data):this.onpong(data),this._state=GET_INFO
else if(0===data.length)this._loop=!1,this.onclose(1005,""),this.cleanup(this._cleanupCallback)
else if(1===data.length)this.error(new RangeError("Invalid WebSocket frame: invalid payload length 1"),1002)
else{var code=data.readUInt16BE(0,!0)
if(!validation.isValidStatusCode(code))return void this.error(new RangeError("Invalid WebSocket frame: invalid status code "+code),1002)

var buf=data.slice(2)
if(!validation.isValidUTF8(buf))return void this.error(new Error("Invalid WebSocket frame: invalid UTF-8 sequence"),1007)

this._loop=!1,this.onclose(code,buf.toString()),this.cleanup(this._cleanupCallback)}},
Receiver.prototype.error=function(err,code){this._hadError=!0,this._loop=!1,this.onerror(err,code),
this.cleanup(this._cleanupCallback)},Receiver.prototype.maxPayloadExceeded=function(length){
if(0===length||this._maxPayload<1)return!1
var fullLength=this._totalPayloadLength+length
return fullLength<=this._maxPayload?(this._totalPayloadLength=fullLength,!1):(this.error(new RangeError("Max payload size exceeded"),1009),
!0)},Receiver.prototype.pushFragment=function(fragment){if(0===fragment.length)return!0
var totalLength=this._messageLength+fragment.length
return this._maxPayload<1||totalLength<=this._maxPayload?(this._messageLength=totalLength,
this._fragments.push(fragment),!0):(this.error(new RangeError("Max payload size exceeded"),1009),!1)
},Receiver.prototype.cleanup=function(cb){
return null===this._extensions?void(cb&&cb()):this._hadError||!this._loop&&this._state!==INFLATING?(this._extensions=null,
this._fragments=null,this._buffers=null,this._mask=null,this._cleanupCallback=null,
this.onmessage=null,this.onclose=null,this.onerror=null,this.onping=null,this.onpong=null,
void(cb&&cb())):(this._cleanupCallback=cb,void(this._isCleaningUp=!0))},Receiver}()
module.exports=Receiver})


define("ws/lib/sender",[],function(require,exports,module){"use strict"
function viewToBuffer(view){var buf=Buffer.from(view.buffer)
return view.byteLength!==view.buffer.byteLength?buf.slice(view.byteOffset,view.byteOffset+view.byteLength):buf
}
var safeBuffer=require("safe-buffer"),crypto=require("crypto"),PerMessageDeflate=require("./permessage-deflate"),bufferUtil=require("./buffer-util"),validation=require("./validation"),constants=require("./constants"),Buffer=safeBuffer.Buffer,Sender=function(){
function Sender(socket,extensions){this._extensions=extensions||{},this._socket=socket,
this._firstFragment=!0,this._compress=!1,this._bufferedBytes=0,this._deflating=!1,this._queue=[]}
return Sender.frame=function(data,options){
var merge=data.length<1024||options.mask&&options.readOnly,offset=options.mask?6:2,payloadLength=data.length

data.length>=65536?(offset+=8,payloadLength=127):data.length>125&&(offset+=2,payloadLength=126)
var target=Buffer.allocUnsafe(merge?data.length+offset:offset)
if(target[0]=options.fin?128|options.opcode:options.opcode,options.rsv1&&(target[0]|=64),
126===payloadLength?target.writeUInt16BE(data.length,2,!0):127===payloadLength&&(target.writeUInt32BE(0,2,!0),
target.writeUInt32BE(data.length,6,!0)),!options.mask)return target[1]=payloadLength,
merge?(data.copy(target,offset),[target]):[target,data]
var mask=crypto.randomBytes(4)
return target[1]=128|payloadLength,target[offset-4]=mask[0],target[offset-3]=mask[1],
target[offset-2]=mask[2],
target[offset-1]=mask[3],merge?(bufferUtil.mask(data,mask,target,offset,data.length),
[target]):(bufferUtil.mask(data,mask,data,0,data.length),[target,data])
},Sender.prototype.close=function(code,data,mask,cb){var buf
if(void 0===code)buf=constants.EMPTY_BUFFER
else{
if("number"!=typeof code||!validation.isValidStatusCode(code))throw new TypeError("First argument must be a valid error code number")

void 0===data||""===data?(buf=Buffer.allocUnsafe(2),buf.writeUInt16BE(code,0,!0)):(buf=Buffer.allocUnsafe(2+Buffer.byteLength(data)),
buf.writeUInt16BE(code,0,!0),buf.write(data,2))}
this._deflating?this.enqueue([this.doClose,buf,mask,cb]):this.doClose(buf,mask,cb)},
Sender.prototype.doClose=function(data,mask,cb){this.sendFrame(Sender.frame(data,{fin:!0,rsv1:!1,
opcode:8,mask:mask,readOnly:!1}),cb)},Sender.prototype.ping=function(data,mask,cb){var readOnly=!0
Buffer.isBuffer(data)||(data instanceof ArrayBuffer?data=Buffer.from(data):ArrayBuffer.isView(data)?data=viewToBuffer(data):(data=Buffer.from(data),
readOnly=!1)),
this._deflating?this.enqueue([this.doPing,data,mask,readOnly,cb]):this.doPing(data,mask,readOnly,cb)
},Sender.prototype.doPing=function(data,mask,readOnly,cb){this.sendFrame(Sender.frame(data,{fin:!0,
rsv1:!1,opcode:9,mask:mask,readOnly:readOnly}),cb)},Sender.prototype.pong=function(data,mask,cb){
var readOnly=!0
Buffer.isBuffer(data)||(data instanceof ArrayBuffer?data=Buffer.from(data):ArrayBuffer.isView(data)?data=viewToBuffer(data):(data=Buffer.from(data),
readOnly=!1)),
this._deflating?this.enqueue([this.doPong,data,mask,readOnly,cb]):this.doPong(data,mask,readOnly,cb)
},Sender.prototype.doPong=function(data,mask,readOnly,cb){this.sendFrame(Sender.frame(data,{fin:!0,
rsv1:!1,opcode:10,mask:mask,readOnly:readOnly}),cb)
},Sender.prototype.send=function(data,options,cb){
var opcode=options.binary?2:1,rsv1=options.compress,readOnly=!0
Buffer.isBuffer(data)||(data instanceof ArrayBuffer?data=Buffer.from(data):ArrayBuffer.isView(data)?data=viewToBuffer(data):(data=Buffer.from(data),
readOnly=!1))
var perMessageDeflate=this._extensions[PerMessageDeflate.extensionName]
if(this._firstFragment?(this._firstFragment=!1,rsv1&&perMessageDeflate&&(rsv1=data.length>=perMessageDeflate._threshold),
this._compress=rsv1):(rsv1=!1,opcode=0),options.fin&&(this._firstFragment=!0),perMessageDeflate){
var opts={fin:options.fin,rsv1:rsv1,opcode:opcode,mask:options.mask,readOnly:readOnly}
this._deflating?this.enqueue([this.dispatch,data,this._compress,opts,cb]):this.dispatch(data,this._compress,opts,cb)
}else this.sendFrame(Sender.frame(data,{fin:options.fin,rsv1:!1,opcode:opcode,mask:options.mask,
readOnly:readOnly}),cb)},Sender.prototype.dispatch=function(data,compress,options,cb){var _this=this
if(!compress)return void this.sendFrame(Sender.frame(data,options),cb)
var perMessageDeflate=this._extensions[PerMessageDeflate.extensionName]
this._deflating=!0,perMessageDeflate.compress(data,options.fin,function(_,buf){options.readOnly=!1,
_this.sendFrame(Sender.frame(buf,options),cb),_this._deflating=!1,_this.dequeue()})},
Sender.prototype.dequeue=function(){for(;!this._deflating&&this._queue.length;){
var params=this._queue.shift()
this._bufferedBytes-=params[1].length,params[0].apply(this,params.slice(1))}
},Sender.prototype.enqueue=function(params){this._bufferedBytes+=params[1].length,
this._queue.push(params)},Sender.prototype.sendFrame=function(list,cb){
2===list.length?(this._socket.write(list[0]),
this._socket.write(list[1],cb)):this._socket.write(list[0],cb)},Sender}()
module.exports=Sender})


var __extends=this&&this.__extends||function(){var extendStatics=function(d,b){
return(extendStatics=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(d,b){
d.__proto__=b}||function(d,b){for(var p in b)b.hasOwnProperty(p)&&(d[p]=b[p])})(d,b)}
return function(d,b){function __(){this.constructor=d}
extendStatics(d,b),d.prototype=null===b?Object.create(b):(__.prototype=b.prototype,new __)}}()
define("ws/lib/websocket",[],function(require,exports,module){"use strict"
function initAsClient(address,protocols,options){var _a,_this=this
if(options=Object.assign({protocolVersion:protocolVersions[1],protocol:protocols.join(","),
perMessageDeflate:!0,handshakeTimeout:null,localAddress:null,headers:null,family:null,origin:null,
agent:null,host:null,checkServerIdentity:null,rejectUnauthorized:null,passphrase:null,ciphers:null,
ecdhCurve:null,cert:null,key:null,pfx:null,ca:null
},options),-1===protocolVersions.indexOf(options.protocolVersion))throw new RangeError("Unsupported protocol version: "+options.protocolVersion+" (supported versions: "+protocolVersions.join(", ")+")")

this._isServer=!1,this.url=address
var serverUrl=url.parse(address),isUnixSocket="ws+unix:"===serverUrl.protocol
if(!(serverUrl.host||isUnixSocket&&serverUrl.path))throw new Error("Invalid URL: "+address)
var perMessageDeflate,isSecure="wss:"===serverUrl.protocol||"https:"===serverUrl.protocol,key=crypto.randomBytes(16).toString("base64"),httpObj=isSecure?https:http,requestOptions={
port:serverUrl.port||(isSecure?443:80),host:serverUrl.hostname,path:"/",headers:{
"Sec-WebSocket-Version":options.protocolVersion,"Sec-WebSocket-Key":key,Connection:"Upgrade",
Upgrade:"websocket"}}
if(options.headers&&Object.assign(requestOptions.headers,options.headers),options.perMessageDeflate&&(perMessageDeflate=new PerMessageDeflate(!0!==options.perMessageDeflate?options.perMessageDeflate:{},!1),
requestOptions.headers["Sec-WebSocket-Extensions"]=extension.format((_a={},
_a[PerMessageDeflate.extensionName]=perMessageDeflate.offer(),
_a))),options.protocol&&(requestOptions.headers["Sec-WebSocket-Protocol"]=options.protocol),
options.origin&&(options.protocolVersion<13?requestOptions.headers["Sec-WebSocket-Origin"]=options.origin:requestOptions.headers.Origin=options.origin),
options.host&&(requestOptions.headers.Host=options.host),
serverUrl.auth&&(requestOptions.auth=serverUrl.auth),
options.localAddress&&(requestOptions.localAddress=options.localAddress),
options.family&&(requestOptions.family=options.family),isUnixSocket){
var parts=serverUrl.path.split(":")
requestOptions.socketPath=parts[0],requestOptions.path=parts[1]
}else serverUrl.path&&("/"!==serverUrl.path.charAt(0)?requestOptions.path="/"+serverUrl.path:requestOptions.path=serverUrl.path)

var agent=options.agent
;(null!=options.rejectUnauthorized||options.checkServerIdentity||options.passphrase||options.ciphers||options.ecdhCurve||options.cert||options.key||options.pfx||options.ca)&&(options.passphrase&&(requestOptions.passphrase=options.passphrase),
options.ciphers&&(requestOptions.ciphers=options.ciphers),
options.ecdhCurve&&(requestOptions.ecdhCurve=options.ecdhCurve),
options.cert&&(requestOptions.cert=options.cert),options.key&&(requestOptions.key=options.key),
options.pfx&&(requestOptions.pfx=options.pfx),options.ca&&(requestOptions.ca=options.ca),
options.checkServerIdentity&&(requestOptions.checkServerIdentity=options.checkServerIdentity),
null!=options.rejectUnauthorized&&(requestOptions.rejectUnauthorized=options.rejectUnauthorized),
agent||(agent=new httpObj.Agent(requestOptions))),agent&&(requestOptions.agent=agent),
this._req=httpObj.get(requestOptions),
options.handshakeTimeout&&this._req.setTimeout(options.handshakeTimeout,function(){
_this._req.abort(),_this.finalize(new Error("Opening handshake has timed out"))}),
this._req.on("error",function(error){_this._req.aborted||(_this._req=null,_this.finalize(error))}),
this._req.on("response",function(res){
_this.emit("unexpected-response",_this._req,res)||(_this._req.abort(),
_this.finalize(new Error("Unexpected server response: "+res.statusCode)))
}),this._req.on("upgrade",function(res,socket,head){if(_this.emit("upgrade",res),
_this.readyState===WebSocket.CONNECTING){_this._req=null
var digest=crypto.createHash("sha1").update(key+constants.GUID,"binary").digest("base64")
if(res.headers["sec-websocket-accept"]!==digest)return socket.destroy(),_this.finalize(new Error("Invalid Sec-WebSocket-Accept header"))

var protError,serverProt=res.headers["sec-websocket-protocol"],protList=(options.protocol||"").split(/, */)

if(!options.protocol&&serverProt?protError="Server sent a subprotocol but none was requested":options.protocol&&!serverProt?protError="Server sent no subprotocol":serverProt&&-1===protList.indexOf(serverProt)&&(protError="Server sent an invalid subprotocol"),
protError)return socket.destroy(),_this.finalize(new Error(protError))
if(serverProt&&(_this.protocol=serverProt),perMessageDeflate)try{
var extensions=extension.parse(res.headers["sec-websocket-extensions"])
extensions[PerMessageDeflate.extensionName]&&(perMessageDeflate.accept(extensions[PerMessageDeflate.extensionName]),
_this._extensions[PerMessageDeflate.extensionName]=perMessageDeflate)}catch(err){
return socket.destroy(),void _this.finalize(new Error("Invalid Sec-WebSocket-Extensions header"))}
_this.setSocket(socket,head,0)}})}
var EventEmitter=require("events"),crypto=require("crypto"),https=require("https"),http=require("http"),url=require("url"),PerMessageDeflate=require("./permessage-deflate"),EventTarget=require("./event-target"),extension=require("./extension"),constants=require("./constants"),Receiver=require("./receiver"),Sender=require("./sender"),readyStates=["CONNECTING","OPEN","CLOSING","CLOSED"],protocolVersions=[8,13],closeTimeout=3e4,WebSocket=function(_super){
function WebSocket(address,protocols,options){var _this=_super.call(this)||this
return _this.readyState=WebSocket.CONNECTING,_this.protocol="",_this._binaryType=constants.BINARY_TYPES[0],
_this._finalize=_this.finalize.bind(_this),_this._closeFrameReceived=!1,_this._closeFrameSent=!1,
_this._closeMessage="",_this._closeTimer=null,_this._finalized=!1,_this._closeCode=1006,
_this._extensions={},_this._isServer=!0,_this._receiver=null,_this._sender=null,_this._socket=null,
_this._error=null,
null!==address&&(protocols?"string"==typeof protocols?protocols=[protocols]:Array.isArray(protocols)||(options=protocols,
protocols=[]):protocols=[],initAsClient.call(_this,address,protocols,options)),_this}
return __extends(WebSocket,_super),Object.defineProperty(WebSocket.prototype,"CONNECTING",{
get:function(){return WebSocket.CONNECTING},enumerable:!0,configurable:!0
}),Object.defineProperty(WebSocket.prototype,"CLOSING",{get:function(){return WebSocket.CLOSING},
enumerable:!0,configurable:!0}),Object.defineProperty(WebSocket.prototype,"CLOSED",{get:function(){
return WebSocket.CLOSED},enumerable:!0,configurable:!0
}),Object.defineProperty(WebSocket.prototype,"OPEN",{get:function(){return WebSocket.OPEN},
enumerable:!0,configurable:!0}),Object.defineProperty(WebSocket.prototype,"binaryType",{
get:function(){return this._binaryType},set:function(type){
constants.BINARY_TYPES.indexOf(type)<0||(this._binaryType=type,
this._receiver&&(this._receiver._binaryType=type))},enumerable:!0,configurable:!0}),
Object.defineProperty(WebSocket.prototype,"bufferedAmount",{get:function(){
return this._socket?(this._socket.bufferSize||0)+this._sender._bufferedBytes:0},enumerable:!0,
configurable:!0}),Object.defineProperty(WebSocket.prototype,"extensions",{get:function(){
return Object.keys(this._extensions).join()},enumerable:!0,configurable:!0
}),WebSocket.prototype.setSocket=function(socket,head,maxPayload){var _this=this
socket.setTimeout(0),socket.setNoDelay(),socket.on("close",this._finalize),socket.on("error",this._finalize),
socket.on("end",this._finalize),
this._receiver=new Receiver(this._extensions,maxPayload,this.binaryType),
this._sender=new Sender(socket,this._extensions),
this._socket=socket,head.length>0&&socket.unshift(head),socket.on("data",this._receiver.add),
this._receiver.onmessage=function(data){return _this.emit("message",data)
},this._receiver.onping=function(data){_this.pong(data,!_this._isServer,constants.NOOP),
_this.emit("ping",data)},this._receiver.onpong=function(data){return _this.emit("pong",data)},
this._receiver.onclose=function(code,reason){
_this._socket.removeListener("data",_this._receiver.add),_this._closeFrameReceived=!0,
_this._closeMessage=reason,_this._closeCode=code,1005===code?_this.close():_this.close(code,reason)
},this._receiver.onerror=function(error,code){_this._error||(_this._closeCode=code,
_this._finalized?_this.emit("error",error):_this.finalize(error))},this.readyState=WebSocket.OPEN,
this.emit("open")},WebSocket.prototype.finalize=function(error){var _this=this
if(!this._finalized){
if(this.readyState=WebSocket.CLOSING,this._finalized=!0,!this._socket)return this.emit("error",error),
this.readyState=WebSocket.CLOSED,void this.emit("close",this._closeCode,this._closeMessage)
clearTimeout(this._closeTimer),this._socket.removeListener("data",this._receiver.add),
this._socket.removeListener("close",this._finalize),
this._socket.removeListener("error",this._finalize),
this._socket.removeListener("end",this._finalize),this._socket.on("error",constants.NOOP),
error?(!0!==error&&(this._error=error),this._socket.destroy()):this._socket.end(),
this._receiver.cleanup(function(){var err=_this._error
err&&(_this._error=null,_this.emit("error",err)),_this.readyState=WebSocket.CLOSED,
_this._extensions[PerMessageDeflate.extensionName]&&_this._extensions[PerMessageDeflate.extensionName].cleanup(),
_this.emit("close",_this._closeCode,_this._closeMessage)})}
},WebSocket.prototype.close=function(code,data){var _this=this
if(this.readyState!==WebSocket.CLOSED){
if(this.readyState===WebSocket.CONNECTING)return this._req.abort(),
void this.finalize(new Error("WebSocket was closed before the connection was established"))
if(this.readyState===WebSocket.CLOSING)return void(this._closeFrameSent&&this._closeFrameReceived&&this._socket.end())

this.readyState=WebSocket.CLOSING,this._sender.close(code,data,!this._isServer,function(err){
err||(_this._closeFrameSent=!0,_this._finalized||(_this._closeFrameReceived&&_this._socket.end(),
_this._closeTimer=setTimeout(_this._finalize,closeTimeout,!0)))})}
},WebSocket.prototype.ping=function(data,mask,cb){if("function"==typeof data?(cb=data,
data=mask=void 0):"function"==typeof mask&&(cb=mask,mask=void 0),this.readyState!==WebSocket.OPEN){
var err=new Error("WebSocket is not open: readyState "+this.readyState+" ("+readyStates[this.readyState]+")")

if(cb)return cb(err)
throw err}"number"==typeof data&&(data=data.toString()),void 0===mask&&(mask=!this._isServer),
this._sender.ping(data||constants.EMPTY_BUFFER,mask,cb)
},WebSocket.prototype.pong=function(data,mask,cb){if("function"==typeof data?(cb=data,
data=mask=void 0):"function"==typeof mask&&(cb=mask,mask=void 0),this.readyState!==WebSocket.OPEN){
var err=new Error("WebSocket is not open: readyState "+this.readyState+" ("+readyStates[this.readyState]+")")

if(cb)return cb(err)
throw err}"number"==typeof data&&(data=data.toString()),void 0===mask&&(mask=!this._isServer),
this._sender.pong(data||constants.EMPTY_BUFFER,mask,cb)
},WebSocket.prototype.send=function(data,options,cb){if("function"==typeof options&&(cb=options,
options={}),this.readyState!==WebSocket.OPEN){
var err=new Error("WebSocket is not open: readyState "+this.readyState+" ("+readyStates[this.readyState]+")")

if(cb)return cb(err)
throw err}"number"==typeof data&&(data=data.toString())
var opts=Object.assign({binary:"string"!=typeof data,mask:!this._isServer,compress:!0,fin:!0
},options)
this._extensions[PerMessageDeflate.extensionName]||(opts.compress=!1),this._sender.send(data||constants.EMPTY_BUFFER,opts,cb)
},WebSocket.prototype.terminate=function(){
if(this.readyState!==WebSocket.CLOSED)return this.readyState===WebSocket.CONNECTING?(this._req.abort(),
void this.finalize(new Error("WebSocket was closed before the connection was established"))):void this.finalize(!0)
},WebSocket}(EventEmitter)
readyStates.forEach(function(readyState,i){WebSocket[readyStates[i]]=i
}),["open","error","close","message"].forEach(function(method){
Object.defineProperty(WebSocket.prototype,"on"+method,{get:function(){
for(var listeners=this.listeners(method),i=0;i<listeners.length;i++)if(listeners[i]._listener)return listeners[i]._listener
},set:function(listener){
for(var listeners=this.listeners(method),i=0;i<listeners.length;i++)listeners[i]._listener&&this.removeListener(method,listeners[i])

this.addEventListener(method,listener)}})
}),WebSocket.prototype.addEventListener=EventTarget.addEventListener,
WebSocket.prototype.removeEventListener=EventTarget.removeEventListener,module.exports=WebSocket})


var __extends=this&&this.__extends||function(){var extendStatics=function(d,b){
return(extendStatics=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(d,b){
d.__proto__=b}||function(d,b){for(var p in b)b.hasOwnProperty(p)&&(d[p]=b[p])})(d,b)}
return function(d,b){function __(){this.constructor=d}
extendStatics(d,b),d.prototype=null===b?Object.create(b):(__.prototype=b.prototype,new __)}
}(),__values=this&&this.__values||function(o){
var m="function"==typeof Symbol&&o[Symbol.iterator],i=0
return m?m.call(o):{next:function(){return o&&i>=o.length&&(o=void 0),{value:o&&o[i++],done:!o}}}}
define("ws/lib/websocket-server",[],function(require,exports,module){"use strict"
function addListeners(server,map){var e_2,_a
try{for(var _b=__values(Object.keys(map)),_c=_b.next();!_c.done;_c=_b.next()){var event=_c.value
server.on(event,map[event])}}catch(e_2_1){e_2={error:e_2_1}}finally{try{
_c&&!_c.done&&(_a=_b.return)&&_a.call(_b)}finally{if(e_2)throw e_2.error}}return function(){
var e_3,_a
try{for(var _b=__values(Object.keys(map)),_c=_b.next();!_c.done;_c=_b.next()){var event=_c.value
server.removeListener(event,map[event])}}catch(e_3_1){e_3={error:e_3_1}}finally{try{
_c&&!_c.done&&(_a=_b.return)&&_a.call(_b)}finally{if(e_3)throw e_3.error}}}}
function socketOnError(){this.destroy()}function abortConnection(socket,code,message){
socket.writable&&(message=message||http.STATUS_CODES[code],
socket.write("HTTP/1.1 "+code+" "+http.STATUS_CODES[code]+"\r\nConnection: close\r\nContent-type: text/html\r\nContent-Length: "+Buffer.byteLength(message)+"\r\n\r\n"+message)),
socket.removeListener("error",socketOnError),socket.destroy()}
var safeBuffer=require("safe-buffer"),EventEmitter=require("events"),crypto=require("crypto"),http=require("http"),url=require("url"),PerMessageDeflate=require("./permessage-deflate"),extension=require("./extension"),constants=require("./constants"),WebSocket=require("./websocket"),Buffer=safeBuffer.Buffer,WebSocketServer=function(_super){
function WebSocketServer(options,callback){var _this=_super.call(this)||this
if(options=Object.assign({maxPayload:104857600,perMessageDeflate:!1,handleProtocols:null,
clientTracking:!0,verifyClient:null,noServer:!1,backlog:null,server:null,host:null,path:null,
port:null
},options),null==options.port&&!options.server&&!options.noServer)throw new TypeError('One of the "port", "server", or "noServer" options must be specified')

return null!=options.port?(_this._server=http.createServer(function(req,res){
var body=http.STATUS_CODES[426]
res.writeHead(426,{"Content-Length":body.length,"Content-Type":"text/plain"}),res.end(body)}),
_this._server.listen(options.port,options.host,options.backlog,callback)):options.server&&(_this._server=options.server),
_this._server&&(_this._removeListeners=addListeners(_this._server,{
listening:_this.emit.bind(_this,"listening"),error:_this.emit.bind(_this,"error"),
upgrade:function(req,socket,head){_this.handleUpgrade(req,socket,head,function(ws){
_this.emit("connection",ws,req)})}
})),!0===options.perMessageDeflate&&(options.perMessageDeflate={}),
options.clientTracking&&(_this.clients=new Set),_this.options=options,_this}
return __extends(WebSocketServer,_super),WebSocketServer.prototype.address=function(){
if(this.options.noServer)throw new Error('The server is operating in "noServer" mode')
return this._server?this._server.address():null},WebSocketServer.prototype.close=function(cb){
var e_1,_a
if(this.clients)try{for(var _b=__values(this.clients),_c=_b.next();!_c.done;_c=_b.next()){
_c.value.terminate()}}catch(e_1_1){e_1={error:e_1_1}}finally{try{
_c&&!_c.done&&(_a=_b.return)&&_a.call(_b)}finally{if(e_1)throw e_1.error}}var server=this._server
if(server&&(this._removeListeners(),this._removeListeners=this._server=null,null!=this.options.port))return server.close(cb)

cb&&cb()},WebSocketServer.prototype.shouldHandle=function(req){
return!this.options.path||url.parse(req.url).pathname===this.options.path
},WebSocketServer.prototype.handleUpgrade=function(req,socket,head,cb){var _this=this
socket.on("error",socketOnError)
var version=+req.headers["sec-websocket-version"],extensions={}
if("GET"!==req.method||"websocket"!==req.headers.upgrade.toLowerCase()||!req.headers["sec-websocket-key"]||8!==version&&13!==version||!this.shouldHandle(req))return abortConnection(socket,400)

if(this.options.perMessageDeflate){
var perMessageDeflate=new PerMessageDeflate(this.options.perMessageDeflate,!0,this.options.maxPayload)

try{var offers=extension.parse(req.headers["sec-websocket-extensions"])
offers[PerMessageDeflate.extensionName]&&(perMessageDeflate.accept(offers[PerMessageDeflate.extensionName]),
extensions[PerMessageDeflate.extensionName]=perMessageDeflate)}catch(err){
return abortConnection(socket,400)}}
var protocol=(req.headers["sec-websocket-protocol"]||"").split(/, */)
if(this.options.handleProtocols){
if(!1===(protocol=this.options.handleProtocols(protocol,req)))return abortConnection(socket,401)
}else protocol=protocol[0]
if(this.options.verifyClient){var info={
origin:req.headers[8===version?"sec-websocket-origin":"origin"],
secure:!(!req.connection.authorized&&!req.connection.encrypted),req:req}
if(2===this.options.verifyClient.length)return void this.options.verifyClient(info,function(verified,code,message){
if(!verified)return abortConnection(socket,code||401,message)
_this.completeUpgrade(protocol,extensions,req,socket,head,cb)})
if(!this.options.verifyClient(info))return abortConnection(socket,401)}
this.completeUpgrade(protocol,extensions,req,socket,head,cb)
},WebSocketServer.prototype.completeUpgrade=function(protocol,extensions,req,socket,head,cb){
var _a,_this=this
if(!socket.readable||!socket.writable)return socket.destroy()
var key=crypto.createHash("sha1").update(req.headers["sec-websocket-key"]+constants.GUID,"binary").digest("base64"),headers=["HTTP/1.1 101 Switching Protocols","Upgrade: websocket","Connection: Upgrade","Sec-WebSocket-Accept: "+key],ws=new WebSocket(null)

if(protocol&&(headers.push("Sec-WebSocket-Protocol: "+protocol),ws.protocol=protocol),
extensions[PerMessageDeflate.extensionName]){
var params=extensions[PerMessageDeflate.extensionName].params,value=extension.format((_a={},
_a[PerMessageDeflate.extensionName]=[params],_a))
headers.push("Sec-WebSocket-Extensions: "+value),ws._extensions=extensions}
this.emit("headers",headers,req),socket.write(headers.concat("\r\n").join("\r\n")),
socket.removeListener("error",socketOnError),ws.setSocket(socket,head,this.options.maxPayload),
this.clients&&(this.clients.add(ws),ws.on("close",function(){return _this.clients.delete(ws)})),
cb(ws)},WebSocketServer}(EventEmitter)
module.exports=WebSocketServer})


define("ws/index",[],function(require,exports,module){"use strict"
var WebSocket=require("./lib/websocket")
WebSocket.Server=require("./lib/websocket-server"),WebSocket.Receiver=require("./lib/receiver"),
WebSocket.Sender=require("./lib/sender"),module.exports=WebSocket})


define("@c9/ide/plugins/c9.ide.run.debug/debuggers/chrome/MessageReader",[],function(require,exports,module){
function readBytes(str,start,bytes){for(var consumed=0,i=start;i<str.length;i++){
var code=str.charCodeAt(i)
if(code<127?consumed++:code>127&&code<=2047?consumed+=2:code>2047&&code<=65535&&(consumed+=3),
code>=55296&&code<=56319&&i++,consumed>=bytes){i++
break}}return{bytes:consumed,length:i-start}}var MessageReader=function(socket,callback){
this.$socket=socket,this.$callback=callback,this.$received="",this.$expectedBytes=0,this.$offset=0,
this.$cbReceive=this.$onreceive.bind(this),socket.on("data",this.$cbReceive)};(function(){
this.$onreceive=function(data){this.$received+=data
for(var fullResponse;!1!==(fullResponse=this.$checkForWholeMessage());)this.$callback(fullResponse)
},this.$checkForWholeMessage=function(){var fullResponse=!1,received=this.$received
if(!this.$expectedBytes){var i=received.indexOf("\r\n\r\n")
if(-1!==i){var c=received.lastIndexOf("Content-Length:",i)
if(-1!=c){var l=received.indexOf("\r\n",c),len=parseInt(received.substring(c+15,l),10)
this.$expectedBytes=len}this.headerOffset=this.$offset=i+4}}if(this.$expectedBytes){
var result=readBytes(received,this.$offset,this.$expectedBytes)
this.$expectedBytes-=result.bytes,this.$offset+=result.length}
return this.$offset&&this.$expectedBytes<=0&&(fullResponse=received.substring(this.headerOffset||0,this.$offset),
this.$received=received.substr(this.$offset),this.$offset=this.$expectedBytes=0),fullResponse},
this.destroy=function(){this.$socket&&this.$socket.removeListener("data",this.$cbReceive),
delete this.$socket,delete this.$callback,this.$received=""}}).call(MessageReader.prototype),
module.exports=MessageReader})


define("@c9/ide/plugins/c9.ide.run.debug/debuggers/chrome/Debugger",[],function(require,exports,module){
function Debugger(options){var clients=this.clients=[]
this.broadcast=function(message){"string"!=typeof message&&(message=JSON.stringify(message)),
clients.forEach(function(c){c.write(message+"\0")})}}
function getDebuggerData(port,callback,retries){console.log("Connecting to port",port,retries),
null==retries&&(retries=MAX_RETRIES),request({host:"127.0.0.1",port:port,path:"/json/list"
},function(err,res){if(err&&retries>0)return setTimeout(function(){
getDebuggerData(port,callback,retries-1)},RETRY_INTERVAL)
console.log(res),callback(err,res)})}function request(options,callback){var socket=new net.Socket
new MessageReader(socket,function(response){if(console.log("Initial connection response:",response),
socket.end(),response)try{response=JSON.parse(response)}catch(e){}callback(null,response)}),
socket.on("error",function(e){console.log("Initial connection error",options,e),socket.end(),
callback(e)}),socket.connect(options.port,options.host),socket.on("connect",function(){
socket.write("GET "+options.path+" HTTP/1.1\r\nConnection: close\r\n\r\n")})}
var net=require("net"),WebSocket=require("ws/index"),MessageReader=require("./MessageReader"),EventEmitter=require("events").EventEmitter,RETRY_INTERVAL=300,MAX_RETRIES=100
;(function(){this.__proto__=EventEmitter.prototype,this.addClient=function(client){
this.clients.push(client),client.debugger=this},this.removeClient=function(client){
var i=this.clients.indexOf(client);-1!=i&&this.clients.splice(i,1),client.debugger=null},
this.handleMessage=function(message){
this.ws?this.ws.send(JSON.stringify(message)):this.v8Socket?this.v8Socket.send(message):console.error("recieved message when debugger is not ready",message)
},this.connect=function(options){getDebuggerData(options.port,function(err,res){
if(err)return this.broadcast({$:"error",message:err.message}),this.disconnect(),console.log(err)
var tabs=res
if(!tabs)return void this.connectToV8(options)
tabs.length>1&&console.log("connecting to first tab from "+tabs.length),tabs[0]&&tabs[0].webSocketDebuggerUrl&&this.connectToWebsocket(tabs[0].webSocketDebuggerUrl)
}.bind(this))},this.connectToWebsocket=function(url){
var broadcast=this.broadcast,self=this,ws=new WebSocket(url)
ws.on("open",function(){console.log("connected"),broadcast({$:"connected"})
}),ws.on("close",function(){console.log("disconnected"),self.disconnect()
}),ws.on("message",function(data){try{var parsed=JSON.parse(data)}catch(e){}
parsed&&"Runtime.consoleAPICalled"==parsed.method||broadcast(data)}),ws.on("error",function(e){
console.log("error",e),broadcast({$:"error",err:e}),self.disconnect()}),this.ws=ws},
this.connectToV8=function(options){
var broadcast=this.broadcast,self=this,connection=net.connect(options.port,options.host)
connection.on("connect",function(){console.log("netproxy connected to debugger"),broadcast({
$:"connected",mode:"v8"})}),connection.on("error",function(e){
console.log("error in v8 connection",e),self.disconnect()}),connection.on("close",function(e){
console.log("v8 connection closed",e),self.disconnect()
}),new MessageReader(connection,function(response){broadcast(response.toString("utf8"))}),
connection.send=function(msg){
msg.arguments&&!msg.arguments.maxStringLength&&(msg.arguments.maxStringLength=1e4)
var data=new Buffer(JSON.stringify(msg))
connection.write(new Buffer("Content-Length:"+data.length+"\r\n\r\n")),connection.write(data)},
this.v8Socket=connection},this.disconnect=function(){
this.emit("disconnect"),this.clients.forEach(function(client){client.end()
}),this.ws&&this.ws.close(),this.v8Socket&&this.v8Socket.destroy()}}).call(Debugger.prototype),
module.exports=Debugger})


define("@c9/ide/plugins/c9.ide.run.debug/debuggers/chrome/chrome-debug-proxy.js",[],function(require,exports,module){
function checkServer(id){var client=net.connect(socketPath,function(){if(!id)if(force){
console.log("trying to replace existing process")
var strMsg=JSON.stringify({$:"exit"})
client.write(strMsg+"\0")}else console.log("process already exists"),process.exit(0)})
client.on("data",function(data){if(force)return console.log("old pid"+data)
try{var msg=JSON.parse(data.toString().slice(0,-1))}catch(e){}msg&&msg.ping!=id&&process.exit(1),
client.destroy()}),client.on("error",function(err){if(!id&&err){var code=err.code
if("ECONNREFUSED"==code||"ENOENT"===code||"EAGAIN"===code)return createServer()}process.exit(1)}),
force&&client.once("close",function(){server||createServer()})}function createServer(){
server=net.createServer(function(client){function onData(data){data=data.toString()
for(var idx;;){if(-1===(idx=data.indexOf("\0")))return data&&buff.push(data)
buff.push(data.substring(0,idx))
var clientMsg=buff.join("")
if(data=data.substring(idx+1),buff=[],"{"==clientMsg[0])try{var msg=JSON.parse(clientMsg)}catch(e){
return console.log("error parsing message",clientMsg),client.close()}else msg=clientMsg
client.emit("message",msg)}}function onClose(){isClosed||(isClosed=!0,delete ideClients[client.id],
client.debugger&&client.debugger.removeClient(client),client.emit("disconnect"))}var isClosed=!1
client.id=$id++,ideClients[client.id]=client,client.send=function(msg){if(!isClosed){
var strMsg=JSON.stringify(msg)
client.write(strMsg+"\0")}},client.on("data",onData)
var buff=[]
client.on("close",onClose),client.on("end",onClose),client.on("message",function(message){
actions[message.$]?actions[message.$](message,client):client.debugger&&client.debugger.handleMessage(message)
}),client.on("error",function(err){console.log(err),onClose(),client.destroy()}),client.send({
ping:process.pid})}),server.on("error",function(err){throw console.error("server error",err),err}),
server.on("close",function(e){console.log("server closed",e),process.exit(1)}),removeStaleSocket(),
server.listen(socketPath,function(){console.log("server listening on ",socketPath),
checkServer(process.pid)})}function removeStaleSocket(){if(!IS_WINDOWS)try{fs.unlinkSync(socketPath)
}catch(e){"ENOENT"!=e.code&&console.error(e)}}
var fs=require("fs"),net=require("net"),Debugger=require("./Debugger"),IS_WINDOWS=(require("./MessageReader"),
Date.now(),"win32"==process.platform),socketPath=process.env.HOME+"/.c9/chrome.sock"
IS_WINDOWS&&(socketPath="\\\\.\\pipe\\"+socketPath.replace(/\//g,"\\"))
var force=-1!=process.argv.indexOf("--force")
console.log("Using socket",socketPath)
var server,$id=0,ideClients={},debuggers={},actions={exit:function(message,client){process.exit(1)},
ping:function(message,client){message.$="pong",message.t=Date.now(),client.send(message)},
connect:function(message,client,callback){if(!debuggers[message.port]){
var dbg=debuggers[message.port]=new Debugger
debuggers[message.port].connect(message),debuggers[message.port].on("disconnect",function(){
debuggers[message.port]==dbg&&delete debuggers[message.port]})}
debuggers[message.port].addClient(client)},detach:function(message,client,callback){
client.debugger&&client.debugger.disconnect()}},idle=0
setInterval(function(){console.log(Object.keys(ideClients),Object.keys(debuggers)),
Object.keys(ideClients).length||Object.keys(debuggers).length?idle=0:idle++,
idle>2&&(console.log("No open connections, exiting"),process.exit(0))},3e4),checkServer()})

