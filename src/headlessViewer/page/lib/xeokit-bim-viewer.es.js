var e = {};

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
function resolve() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : '/';

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
}
// path.normalize(path)
// posix version
function normalize(path) {
  var isPathAbsolute = isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isPathAbsolute).join('/');

  if (!path && !isPathAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isPathAbsolute ? '/' : '') + path;
}
// posix version
function isAbsolute(path) {
  return path.charAt(0) === '/';
}

// posix version
function join() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
}


// path.relative(from, to)
// posix version
function relative(from, to) {
  from = resolve(from).substr(1);
  to = resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
}

var sep = '/';
var delimiter = ':';

function dirname(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
}

function basename(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
}


function extname(path) {
  return splitPath(path)[3];
}
var t = {
  extname: extname,
  basename: basename,
  dirname: dirname,
  sep: sep,
  delimiter: delimiter,
  relative: relative,
  join: join,
  isAbsolute: isAbsolute,
  normalize: normalize,
  resolve: resolve
};
function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b' ?
    function (str, start, len) { return str.substr(start, len) } :
    function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

/*! pako 2.0.4 https://github.com/nodeca/pako @license (MIT AND Zlib) */var rm=(e,t,s,i)=>{let r=65535&e|0,o=e>>>16&65535|0,n=0;for(;0!==s;){n=s>2e3?2e3:s,s-=n;do{r=r+t[i++]|0,o=o+r|0;}while(--n);r%=65521,o%=65521;}return r|o<<16|0};const om=new Uint32Array((()=>{let e,t=[];for(var s=0;s<256;s++){e=s;for(var i=0;i<8;i++)e=1&e?3988292384^e>>>1:e>>>1;t[s]=e;}return t})());var nm=(e,t,s,i)=>{const r=om,o=i+s;e^=-1;for(let s=i;s<o;s++)e=e>>>8^r[255&(e^t[s])];return -1^e},am=function(e,t){let s,i,r,o,n,a,h,l,u,c,p,d,f,m,g,_,y,v,b,w,P,T,x,M;const D=e.state;s=e.next_in,x=e.input,i=s+(e.avail_in-5),r=e.next_out,M=e.output,o=r-(t-e.avail_out),n=r+(e.avail_out-257),a=D.dmax,h=D.wsize,l=D.whave,u=D.wnext,c=D.window,p=D.hold,d=D.bits,f=D.lencode,m=D.distcode,g=(1<<D.lenbits)-1,_=(1<<D.distbits)-1;e:do{d<15&&(p+=x[s++]<<d,d+=8,p+=x[s++]<<d,d+=8),y=f[p&g];t:for(;;){if(v=y>>>24,p>>>=v,d-=v,v=y>>>16&255,0===v)M[r++]=65535&y;else {if(!(16&v)){if(0==(64&v)){y=f[(65535&y)+(p&(1<<v)-1)];continue t}if(32&v){D.mode=12;break e}e.msg="invalid literal/length code",D.mode=30;break e}b=65535&y,v&=15,v&&(d<v&&(p+=x[s++]<<d,d+=8),b+=p&(1<<v)-1,p>>>=v,d-=v),d<15&&(p+=x[s++]<<d,d+=8,p+=x[s++]<<d,d+=8),y=m[p&_];s:for(;;){if(v=y>>>24,p>>>=v,d-=v,v=y>>>16&255,!(16&v)){if(0==(64&v)){y=m[(65535&y)+(p&(1<<v)-1)];continue s}e.msg="invalid distance code",D.mode=30;break e}if(w=65535&y,v&=15,d<v&&(p+=x[s++]<<d,d+=8,d<v&&(p+=x[s++]<<d,d+=8)),w+=p&(1<<v)-1,w>a){e.msg="invalid distance too far back",D.mode=30;break e}if(p>>>=v,d-=v,v=r-o,w>v){if(v=w-v,v>l&&D.sane){e.msg="invalid distance too far back",D.mode=30;break e}if(P=0,T=c,0===u){if(P+=h-v,v<b){b-=v;do{M[r++]=c[P++];}while(--v);P=r-w,T=M;}}else if(u<v){if(P+=h+u-v,v-=u,v<b){b-=v;do{M[r++]=c[P++];}while(--v);if(P=0,u<b){v=u,b-=v;do{M[r++]=c[P++];}while(--v);P=r-w,T=M;}}}else if(P+=u-v,v<b){b-=v;do{M[r++]=c[P++];}while(--v);P=r-w,T=M;}for(;b>2;)M[r++]=T[P++],M[r++]=T[P++],M[r++]=T[P++],b-=3;b&&(M[r++]=T[P++],b>1&&(M[r++]=T[P++]));}else {P=r-w;do{M[r++]=M[P++],M[r++]=M[P++],M[r++]=M[P++],b-=3;}while(b>2);b&&(M[r++]=M[P++],b>1&&(M[r++]=M[P++]));}break}}break}}while(s<i&&r<n);b=d>>3,s-=b,d-=b<<3,p&=(1<<d)-1,e.next_in=s,e.next_out=r,e.avail_in=s<i?i-s+5:5-(s-i),e.avail_out=r<n?n-r+257:257-(r-n),D.hold=p,D.bits=d;};const hm=new Uint16Array([3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0]),lm=new Uint8Array([16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78]),um=new Uint16Array([1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0]),cm=new Uint8Array([16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64]);var pm=(e,t,s,i,r,o,n,a)=>{const h=a.bits;let l,u,c,p,d,f,m=0,g=0,_=0,y=0,v=0,b=0,w=0,P=0,T=0,x=0,M=null,D=0;const A=new Uint16Array(16),C=new Uint16Array(16);let I,F,B,E=null,S=0;for(m=0;m<=15;m++)A[m]=0;for(g=0;g<i;g++)A[t[s+g]]++;for(v=h,y=15;y>=1&&0===A[y];y--);if(v>y&&(v=y),0===y)return r[o++]=20971520,r[o++]=20971520,a.bits=1,0;for(_=1;_<y&&0===A[_];_++);for(v<_&&(v=_),P=1,m=1;m<=15;m++)if(P<<=1,P-=A[m],P<0)return -1;if(P>0&&(0===e||1!==y))return -1;for(C[1]=0,m=1;m<15;m++)C[m+1]=C[m]+A[m];for(g=0;g<i;g++)0!==t[s+g]&&(n[C[t[s+g]]++]=g);if(0===e?(M=E=n,f=19):1===e?(M=hm,D-=257,E=lm,S-=257,f=256):(M=um,E=cm,f=-1),x=0,g=0,m=_,d=o,b=v,w=0,c=-1,T=1<<v,p=T-1,1===e&&T>852||2===e&&T>592)return 1;for(;;){I=m-w,n[g]<f?(F=0,B=n[g]):n[g]>f?(F=E[S+n[g]],B=M[D+n[g]]):(F=96,B=0),l=1<<m-w,u=1<<b,_=u;do{u-=l,r[d+(x>>w)+u]=I<<24|F<<16|B|0;}while(0!==u);for(l=1<<m-1;x&l;)l>>=1;if(0!==l?(x&=l-1,x+=l):x=0,g++,0==--A[m]){if(m===y)break;m=t[s+n[g]];}if(m>v&&(x&p)!==c){for(0===w&&(w=v),d+=_,b=m-w,P=1<<b;b+w<y&&(P-=A[b+w],!(P<=0));)b++,P<<=1;if(T+=1<<b,1===e&&T>852||2===e&&T>592)return 1;c=x&p,r[c]=v<<24|b<<16|d-o|0;}}return 0!==x&&(r[d+x]=m-w<<24|64<<16|0),a.bits=v,0},dm={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_MEM_ERROR:-4,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8};const{Z_FINISH:fm,Z_BLOCK:mm,Z_TREES:gm,Z_OK:_m,Z_STREAM_END:ym,Z_NEED_DICT:vm,Z_STREAM_ERROR:bm,Z_DATA_ERROR:wm,Z_MEM_ERROR:Pm,Z_BUF_ERROR:Tm,Z_DEFLATED:xm}=dm,Mm=e=>(e>>>24&255)+(e>>>8&65280)+((65280&e)<<8)+((255&e)<<24);function Dm(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new Uint16Array(320),this.work=new Uint16Array(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0;}const Am=e=>{if(!e||!e.state)return bm;const t=e.state;return e.total_in=e.total_out=t.total=0,e.msg="",t.wrap&&(e.adler=1&t.wrap),t.mode=1,t.last=0,t.havedict=0,t.dmax=32768,t.head=null,t.hold=0,t.bits=0,t.lencode=t.lendyn=new Int32Array(852),t.distcode=t.distdyn=new Int32Array(592),t.sane=1,t.back=-1,_m},Cm=e=>{if(!e||!e.state)return bm;const t=e.state;return t.wsize=0,t.whave=0,t.wnext=0,Am(e)},Im=(e,t)=>{let s;if(!e||!e.state)return bm;const i=e.state;return t<0?(s=0,t=-t):(s=1+(t>>4),t<48&&(t&=15)),t&&(t<8||t>15)?bm:(null!==i.window&&i.wbits!==t&&(i.window=null),i.wrap=s,i.wbits=t,Cm(e))},Fm=(e,t)=>{if(!e)return bm;const s=new Dm;e.state=s,s.window=null;const i=Im(e,t);return i!==_m&&(e.state=null),i};let Bm,Em,Sm=!0;const Rm=e=>{if(Sm){Bm=new Int32Array(512),Em=new Int32Array(32);let t=0;for(;t<144;)e.lens[t++]=8;for(;t<256;)e.lens[t++]=9;for(;t<280;)e.lens[t++]=7;for(;t<288;)e.lens[t++]=8;for(pm(1,e.lens,0,288,Bm,0,e.work,{bits:9}),t=0;t<32;)e.lens[t++]=5;pm(2,e.lens,0,32,Em,0,e.work,{bits:5}),Sm=!1;}e.lencode=Bm,e.lenbits=9,e.distcode=Em,e.distbits=5;},Om=(e,t,s,i)=>{let r;const o=e.state;return null===o.window&&(o.wsize=1<<o.wbits,o.wnext=0,o.whave=0,o.window=new Uint8Array(o.wsize)),i>=o.wsize?(o.window.set(t.subarray(s-o.wsize,s),0),o.wnext=0,o.whave=o.wsize):(r=o.wsize-o.wnext,r>i&&(r=i),o.window.set(t.subarray(s-i,s-i+r),o.wnext),(i-=r)?(o.window.set(t.subarray(s-i,s),0),o.wnext=i,o.whave=o.wsize):(o.wnext+=r,o.wnext===o.wsize&&(o.wnext=0),o.whave<o.wsize&&(o.whave+=r))),0};var Lm=Cm,Nm=Fm,km=(e,t)=>{let s,i,r,o,n,a,h,l,u,c,p,d,f,m,g,_,y,v,b,w,P,T,x=0;const M=new Uint8Array(4);let D,A;const C=new Uint8Array([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]);if(!e||!e.state||!e.output||!e.input&&0!==e.avail_in)return bm;s=e.state,12===s.mode&&(s.mode=13),n=e.next_out,r=e.output,h=e.avail_out,o=e.next_in,i=e.input,a=e.avail_in,l=s.hold,u=s.bits,c=a,p=h,T=_m;e:for(;;)switch(s.mode){case 1:if(0===s.wrap){s.mode=13;break}for(;u<16;){if(0===a)break e;a--,l+=i[o++]<<u,u+=8;}if(2&s.wrap&&35615===l){s.check=0,M[0]=255&l,M[1]=l>>>8&255,s.check=nm(s.check,M,2,0),l=0,u=0,s.mode=2;break}if(s.flags=0,s.head&&(s.head.done=!1),!(1&s.wrap)||(((255&l)<<8)+(l>>8))%31){e.msg="incorrect header check",s.mode=30;break}if((15&l)!==xm){e.msg="unknown compression method",s.mode=30;break}if(l>>>=4,u-=4,P=8+(15&l),0===s.wbits)s.wbits=P;else if(P>s.wbits){e.msg="invalid window size",s.mode=30;break}s.dmax=1<<s.wbits,e.adler=s.check=1,s.mode=512&l?10:12,l=0,u=0;break;case 2:for(;u<16;){if(0===a)break e;a--,l+=i[o++]<<u,u+=8;}if(s.flags=l,(255&s.flags)!==xm){e.msg="unknown compression method",s.mode=30;break}if(57344&s.flags){e.msg="unknown header flags set",s.mode=30;break}s.head&&(s.head.text=l>>8&1),512&s.flags&&(M[0]=255&l,M[1]=l>>>8&255,s.check=nm(s.check,M,2,0)),l=0,u=0,s.mode=3;case 3:for(;u<32;){if(0===a)break e;a--,l+=i[o++]<<u,u+=8;}s.head&&(s.head.time=l),512&s.flags&&(M[0]=255&l,M[1]=l>>>8&255,M[2]=l>>>16&255,M[3]=l>>>24&255,s.check=nm(s.check,M,4,0)),l=0,u=0,s.mode=4;case 4:for(;u<16;){if(0===a)break e;a--,l+=i[o++]<<u,u+=8;}s.head&&(s.head.xflags=255&l,s.head.os=l>>8),512&s.flags&&(M[0]=255&l,M[1]=l>>>8&255,s.check=nm(s.check,M,2,0)),l=0,u=0,s.mode=5;case 5:if(1024&s.flags){for(;u<16;){if(0===a)break e;a--,l+=i[o++]<<u,u+=8;}s.length=l,s.head&&(s.head.extra_len=l),512&s.flags&&(M[0]=255&l,M[1]=l>>>8&255,s.check=nm(s.check,M,2,0)),l=0,u=0;}else s.head&&(s.head.extra=null);s.mode=6;case 6:if(1024&s.flags&&(d=s.length,d>a&&(d=a),d&&(s.head&&(P=s.head.extra_len-s.length,s.head.extra||(s.head.extra=new Uint8Array(s.head.extra_len)),s.head.extra.set(i.subarray(o,o+d),P)),512&s.flags&&(s.check=nm(s.check,i,d,o)),a-=d,o+=d,s.length-=d),s.length))break e;s.length=0,s.mode=7;case 7:if(2048&s.flags){if(0===a)break e;d=0;do{P=i[o+d++],s.head&&P&&s.length<65536&&(s.head.name+=String.fromCharCode(P));}while(P&&d<a);if(512&s.flags&&(s.check=nm(s.check,i,d,o)),a-=d,o+=d,P)break e}else s.head&&(s.head.name=null);s.length=0,s.mode=8;case 8:if(4096&s.flags){if(0===a)break e;d=0;do{P=i[o+d++],s.head&&P&&s.length<65536&&(s.head.comment+=String.fromCharCode(P));}while(P&&d<a);if(512&s.flags&&(s.check=nm(s.check,i,d,o)),a-=d,o+=d,P)break e}else s.head&&(s.head.comment=null);s.mode=9;case 9:if(512&s.flags){for(;u<16;){if(0===a)break e;a--,l+=i[o++]<<u,u+=8;}if(l!==(65535&s.check)){e.msg="header crc mismatch",s.mode=30;break}l=0,u=0;}s.head&&(s.head.hcrc=s.flags>>9&1,s.head.done=!0),e.adler=s.check=0,s.mode=12;break;case 10:for(;u<32;){if(0===a)break e;a--,l+=i[o++]<<u,u+=8;}e.adler=s.check=Mm(l),l=0,u=0,s.mode=11;case 11:if(0===s.havedict)return e.next_out=n,e.avail_out=h,e.next_in=o,e.avail_in=a,s.hold=l,s.bits=u,vm;e.adler=s.check=1,s.mode=12;case 12:if(t===mm||t===gm)break e;case 13:if(s.last){l>>>=7&u,u-=7&u,s.mode=27;break}for(;u<3;){if(0===a)break e;a--,l+=i[o++]<<u,u+=8;}switch(s.last=1&l,l>>>=1,u-=1,3&l){case 0:s.mode=14;break;case 1:if(Rm(s),s.mode=20,t===gm){l>>>=2,u-=2;break e}break;case 2:s.mode=17;break;case 3:e.msg="invalid block type",s.mode=30;}l>>>=2,u-=2;break;case 14:for(l>>>=7&u,u-=7&u;u<32;){if(0===a)break e;a--,l+=i[o++]<<u,u+=8;}if((65535&l)!=(l>>>16^65535)){e.msg="invalid stored block lengths",s.mode=30;break}if(s.length=65535&l,l=0,u=0,s.mode=15,t===gm)break e;case 15:s.mode=16;case 16:if(d=s.length,d){if(d>a&&(d=a),d>h&&(d=h),0===d)break e;r.set(i.subarray(o,o+d),n),a-=d,o+=d,h-=d,n+=d,s.length-=d;break}s.mode=12;break;case 17:for(;u<14;){if(0===a)break e;a--,l+=i[o++]<<u,u+=8;}if(s.nlen=257+(31&l),l>>>=5,u-=5,s.ndist=1+(31&l),l>>>=5,u-=5,s.ncode=4+(15&l),l>>>=4,u-=4,s.nlen>286||s.ndist>30){e.msg="too many length or distance symbols",s.mode=30;break}s.have=0,s.mode=18;case 18:for(;s.have<s.ncode;){for(;u<3;){if(0===a)break e;a--,l+=i[o++]<<u,u+=8;}s.lens[C[s.have++]]=7&l,l>>>=3,u-=3;}for(;s.have<19;)s.lens[C[s.have++]]=0;if(s.lencode=s.lendyn,s.lenbits=7,D={bits:s.lenbits},T=pm(0,s.lens,0,19,s.lencode,0,s.work,D),s.lenbits=D.bits,T){e.msg="invalid code lengths set",s.mode=30;break}s.have=0,s.mode=19;case 19:for(;s.have<s.nlen+s.ndist;){for(;x=s.lencode[l&(1<<s.lenbits)-1],g=x>>>24,_=x>>>16&255,y=65535&x,!(g<=u);){if(0===a)break e;a--,l+=i[o++]<<u,u+=8;}if(y<16)l>>>=g,u-=g,s.lens[s.have++]=y;else {if(16===y){for(A=g+2;u<A;){if(0===a)break e;a--,l+=i[o++]<<u,u+=8;}if(l>>>=g,u-=g,0===s.have){e.msg="invalid bit length repeat",s.mode=30;break}P=s.lens[s.have-1],d=3+(3&l),l>>>=2,u-=2;}else if(17===y){for(A=g+3;u<A;){if(0===a)break e;a--,l+=i[o++]<<u,u+=8;}l>>>=g,u-=g,P=0,d=3+(7&l),l>>>=3,u-=3;}else {for(A=g+7;u<A;){if(0===a)break e;a--,l+=i[o++]<<u,u+=8;}l>>>=g,u-=g,P=0,d=11+(127&l),l>>>=7,u-=7;}if(s.have+d>s.nlen+s.ndist){e.msg="invalid bit length repeat",s.mode=30;break}for(;d--;)s.lens[s.have++]=P;}}if(30===s.mode)break;if(0===s.lens[256]){e.msg="invalid code -- missing end-of-block",s.mode=30;break}if(s.lenbits=9,D={bits:s.lenbits},T=pm(1,s.lens,0,s.nlen,s.lencode,0,s.work,D),s.lenbits=D.bits,T){e.msg="invalid literal/lengths set",s.mode=30;break}if(s.distbits=6,s.distcode=s.distdyn,D={bits:s.distbits},T=pm(2,s.lens,s.nlen,s.ndist,s.distcode,0,s.work,D),s.distbits=D.bits,T){e.msg="invalid distances set",s.mode=30;break}if(s.mode=20,t===gm)break e;case 20:s.mode=21;case 21:if(a>=6&&h>=258){e.next_out=n,e.avail_out=h,e.next_in=o,e.avail_in=a,s.hold=l,s.bits=u,am(e,p),n=e.next_out,r=e.output,h=e.avail_out,o=e.next_in,i=e.input,a=e.avail_in,l=s.hold,u=s.bits,12===s.mode&&(s.back=-1);break}for(s.back=0;x=s.lencode[l&(1<<s.lenbits)-1],g=x>>>24,_=x>>>16&255,y=65535&x,!(g<=u);){if(0===a)break e;a--,l+=i[o++]<<u,u+=8;}if(_&&0==(240&_)){for(v=g,b=_,w=y;x=s.lencode[w+((l&(1<<v+b)-1)>>v)],g=x>>>24,_=x>>>16&255,y=65535&x,!(v+g<=u);){if(0===a)break e;a--,l+=i[o++]<<u,u+=8;}l>>>=v,u-=v,s.back+=v;}if(l>>>=g,u-=g,s.back+=g,s.length=y,0===_){s.mode=26;break}if(32&_){s.back=-1,s.mode=12;break}if(64&_){e.msg="invalid literal/length code",s.mode=30;break}s.extra=15&_,s.mode=22;case 22:if(s.extra){for(A=s.extra;u<A;){if(0===a)break e;a--,l+=i[o++]<<u,u+=8;}s.length+=l&(1<<s.extra)-1,l>>>=s.extra,u-=s.extra,s.back+=s.extra;}s.was=s.length,s.mode=23;case 23:for(;x=s.distcode[l&(1<<s.distbits)-1],g=x>>>24,_=x>>>16&255,y=65535&x,!(g<=u);){if(0===a)break e;a--,l+=i[o++]<<u,u+=8;}if(0==(240&_)){for(v=g,b=_,w=y;x=s.distcode[w+((l&(1<<v+b)-1)>>v)],g=x>>>24,_=x>>>16&255,y=65535&x,!(v+g<=u);){if(0===a)break e;a--,l+=i[o++]<<u,u+=8;}l>>>=v,u-=v,s.back+=v;}if(l>>>=g,u-=g,s.back+=g,64&_){e.msg="invalid distance code",s.mode=30;break}s.offset=y,s.extra=15&_,s.mode=24;case 24:if(s.extra){for(A=s.extra;u<A;){if(0===a)break e;a--,l+=i[o++]<<u,u+=8;}s.offset+=l&(1<<s.extra)-1,l>>>=s.extra,u-=s.extra,s.back+=s.extra;}if(s.offset>s.dmax){e.msg="invalid distance too far back",s.mode=30;break}s.mode=25;case 25:if(0===h)break e;if(d=p-h,s.offset>d){if(d=s.offset-d,d>s.whave&&s.sane){e.msg="invalid distance too far back",s.mode=30;break}d>s.wnext?(d-=s.wnext,f=s.wsize-d):f=s.wnext-d,d>s.length&&(d=s.length),m=s.window;}else m=r,f=n-s.offset,d=s.length;d>h&&(d=h),h-=d,s.length-=d;do{r[n++]=m[f++];}while(--d);0===s.length&&(s.mode=21);break;case 26:if(0===h)break e;r[n++]=s.length,h--,s.mode=21;break;case 27:if(s.wrap){for(;u<32;){if(0===a)break e;a--,l|=i[o++]<<u,u+=8;}if(p-=h,e.total_out+=p,s.total+=p,p&&(e.adler=s.check=s.flags?nm(s.check,r,p,n-p):rm(s.check,r,p,n-p)),p=h,(s.flags?l:Mm(l))!==s.check){e.msg="incorrect data check",s.mode=30;break}l=0,u=0;}s.mode=28;case 28:if(s.wrap&&s.flags){for(;u<32;){if(0===a)break e;a--,l+=i[o++]<<u,u+=8;}if(l!==(4294967295&s.total)){e.msg="incorrect length check",s.mode=30;break}l=0,u=0;}s.mode=29;case 29:T=ym;break e;case 30:T=wm;break e;case 31:return Pm;default:return bm}return e.next_out=n,e.avail_out=h,e.next_in=o,e.avail_in=a,s.hold=l,s.bits=u,(s.wsize||p!==e.avail_out&&s.mode<30&&(s.mode<27||t!==fm))&&Om(e,e.output,e.next_out,p-e.avail_out),c-=e.avail_in,p-=e.avail_out,e.total_in+=c,e.total_out+=p,s.total+=p,s.wrap&&p&&(e.adler=s.check=s.flags?nm(s.check,r,p,e.next_out-p):rm(s.check,r,p,e.next_out-p)),e.data_type=s.bits+(s.last?64:0)+(12===s.mode?128:0)+(20===s.mode||15===s.mode?256:0),(0===c&&0===p||t===fm)&&T===_m&&(T=Tm),T},jm=e=>{if(!e||!e.state)return bm;let t=e.state;return t.window&&(t.window=null),e.state=null,_m},Gm=(e,t)=>{if(!e||!e.state)return bm;const s=e.state;return 0==(2&s.wrap)?bm:(s.head=t,t.done=!1,_m)},Hm=(e,t)=>{const s=t.length;let i,r,o;return e&&e.state?(i=e.state,0!==i.wrap&&11!==i.mode?bm:11===i.mode&&(r=1,r=rm(r,t,s,0),r!==i.check)?wm:(o=Om(e,t,s,s),o?(i.mode=31,Pm):(i.havedict=1,_m))):bm};const Vm=(e,t)=>Object.prototype.hasOwnProperty.call(e,t);let Um=!0;try{String.fromCharCode.apply(null,new Uint8Array(1));}catch(rm){Um=!1;}const zm=new Uint8Array(256);for(let e=0;e<256;e++)zm[e]=e>=252?6:e>=248?5:e>=240?4:e>=224?3:e>=192?2:1;zm[254]=zm[254]=1;var Wm=(e,t)=>{const s=t||e.length;if("function"==typeof TextDecoder&&TextDecoder.prototype.decode)return (new TextDecoder).decode(e.subarray(0,t));let i,r;const o=new Array(2*s);for(r=0,i=0;i<s;){let t=e[i++];if(t<128){o[r++]=t;continue}let n=zm[t];if(n>4)o[r++]=65533,i+=n-1;else {for(t&=2===n?31:3===n?15:7;n>1&&i<s;)t=t<<6|63&e[i++],n--;n>1?o[r++]=65533:t<65536?o[r++]=t:(t-=65536,o[r++]=55296|t>>10&1023,o[r++]=56320|1023&t);}}return ((e,t)=>{if(t<65534&&e.subarray&&Um)return String.fromCharCode.apply(null,e.length===t?e:e.subarray(0,t));let s="";for(let i=0;i<t;i++)s+=String.fromCharCode(e[i]);return s})(o,r)},Xm=(e,t)=>{(t=t||e.length)>e.length&&(t=e.length);let s=t-1;for(;s>=0&&128==(192&e[s]);)s--;return s<0||0===s?t:s+zm[e[s]]>t?s:t},Ym={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"},Km=function(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0;},Jm=function(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name="",this.comment="",this.hcrc=0,this.done=!1;};const Zm=Object.prototype.toString,{Z_NO_FLUSH:Qm,Z_FINISH:qm,Z_OK:$m,Z_STREAM_END:eg,Z_NEED_DICT:tg,Z_STREAM_ERROR:sg,Z_DATA_ERROR:ig,Z_MEM_ERROR:rg}=dm;function og(e){this.options=function(e){const t=Array.prototype.slice.call(arguments,1);for(;t.length;){const s=t.shift();if(s){if("object"!=typeof s)throw new TypeError(s+"must be non-object");for(const t in s)Vm(s,t)&&(e[t]=s[t]);}}return e}({chunkSize:65536,windowBits:15,to:""},e||{});const t=this.options;t.raw&&t.windowBits>=0&&t.windowBits<16&&(t.windowBits=-t.windowBits,0===t.windowBits&&(t.windowBits=-15)),!(t.windowBits>=0&&t.windowBits<16)||e&&e.windowBits||(t.windowBits+=32),t.windowBits>15&&t.windowBits<48&&0==(15&t.windowBits)&&(t.windowBits|=15),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new Km,this.strm.avail_out=0;let s=Nm(this.strm,t.windowBits);if(s!==$m)throw new Error(Ym[s]);if(this.header=new Jm,Gm(this.strm,this.header),t.dictionary&&("string"==typeof t.dictionary?t.dictionary=(e=>{if("function"==typeof TextEncoder&&TextEncoder.prototype.encode)return (new TextEncoder).encode(e);let t,s,i,r,o,n=e.length,a=0;for(r=0;r<n;r++)s=e.charCodeAt(r),55296==(64512&s)&&r+1<n&&(i=e.charCodeAt(r+1),56320==(64512&i)&&(s=65536+(s-55296<<10)+(i-56320),r++)),a+=s<128?1:s<2048?2:s<65536?3:4;for(t=new Uint8Array(a),o=0,r=0;o<a;r++)s=e.charCodeAt(r),55296==(64512&s)&&r+1<n&&(i=e.charCodeAt(r+1),56320==(64512&i)&&(s=65536+(s-55296<<10)+(i-56320),r++)),s<128?t[o++]=s:s<2048?(t[o++]=192|s>>>6,t[o++]=128|63&s):s<65536?(t[o++]=224|s>>>12,t[o++]=128|s>>>6&63,t[o++]=128|63&s):(t[o++]=240|s>>>18,t[o++]=128|s>>>12&63,t[o++]=128|s>>>6&63,t[o++]=128|63&s);return t})(t.dictionary):"[object ArrayBuffer]"===Zm.call(t.dictionary)&&(t.dictionary=new Uint8Array(t.dictionary)),t.raw&&(s=Hm(this.strm,t.dictionary),s!==$m)))throw new Error(Ym[s])}function ng(e,t){const s=new og(t);if(s.push(e),s.err)throw s.msg||Ym[s.err];return s.result}og.prototype.push=function(e,t){const s=this.strm,i=this.options.chunkSize,r=this.options.dictionary;let o,n,a;if(this.ended)return !1;for(n=t===~~t?t:!0===t?qm:Qm,"[object ArrayBuffer]"===Zm.call(e)?s.input=new Uint8Array(e):s.input=e,s.next_in=0,s.avail_in=s.input.length;;){for(0===s.avail_out&&(s.output=new Uint8Array(i),s.next_out=0,s.avail_out=i),o=km(s,n),o===tg&&r&&(o=Hm(s,r),o===$m?o=km(s,n):o===ig&&(o=tg));s.avail_in>0&&o===eg&&s.state.wrap>0&&0!==e[s.next_in];)Lm(s),o=km(s,n);switch(o){case sg:case ig:case tg:case rg:return this.onEnd(o),this.ended=!0,!1}if(a=s.avail_out,s.next_out&&(0===s.avail_out||o===eg))if("string"===this.options.to){let e=Xm(s.output,s.next_out),t=s.next_out-e,r=Wm(s.output,e);s.next_out=t,s.avail_out=i-t,t&&s.output.set(s.output.subarray(e,e+t),0),this.onData(r);}else this.onData(s.output.length===s.next_out?s.output:s.output.subarray(0,s.next_out));if(o!==$m||0!==a){if(o===eg)return o=jm(this.strm),this.onEnd(o),this.ended=!0,!0;if(0===s.avail_in)break}}return !0},og.prototype.onData=function(e){this.chunks.push(e);},og.prototype.onEnd=function(e){e===$m&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=(e=>{let t=0;for(let s=0,i=e.length;s<i;s++)t+=e[s].length;const s=new Uint8Array(t);for(let t=0,i=0,r=e.length;t<r;t++){let r=e[t];s.set(r,i),i+=r.length;}return s})(this.chunks)),this.chunks=[],this.err=e,this.msg=this.strm.msg;};var ag=og,hg=ng,lg=function(e,t){return (t=t||{}).raw=!0,ng(e,t)},ug=ng,cg=dm,pg={Inflate:ag,inflate:hg,inflateRaw:lg,ungzip:ug,constants:cg},dg=Object.freeze({__proto__:null,Inflate:ag,constants:cg,default:pg,inflate:hg,inflateRaw:lg,ungzip:ug});let fg=window.pako||dg;fg.inflate||(fg=fg.default);const mg=function(){const e=new Float32Array(3);return function(t){return e[0]=t[0]/255,e[1]=t[1]/255,e[2]=t[2]/255,e}}();const gg={version:1,parse:function(e,t,s,i){const r=function(e){return {positions:e[0],normals:e[1],indices:e[2],edgeIndices:e[3],meshPositions:e[4],meshIndices:e[5],meshEdgesIndices:e[6],meshColors:e[7],entityIDs:e[8],entityMeshes:e[9],entityIsObjects:e[10],positionsDecodeMatrix:e[11]}}(s),o=function(e){return {positions:new Uint16Array(fg.inflate(e.positions).buffer),normals:new Int8Array(fg.inflate(e.normals).buffer),indices:new Uint32Array(fg.inflate(e.indices).buffer),edgeIndices:new Uint32Array(fg.inflate(e.edgeIndices).buffer),meshPositions:new Uint32Array(fg.inflate(e.meshPositions).buffer),meshIndices:new Uint32Array(fg.inflate(e.meshIndices).buffer),meshEdgesIndices:new Uint32Array(fg.inflate(e.meshEdgesIndices).buffer),meshColors:new Uint8Array(fg.inflate(e.meshColors).buffer),entityIDs:fg.inflate(e.entityIDs,{to:"string"}),entityMeshes:new Uint32Array(fg.inflate(e.entityMeshes).buffer),entityIsObjects:new Uint8Array(fg.inflate(e.entityIsObjects).buffer),positionsDecodeMatrix:new Float32Array(fg.inflate(e.positionsDecodeMatrix).buffer)}}(r);!function(e,t,s,i){i.positionsCompression="precompressed",i.normalsCompression="precompressed";const r=s.positions,o=s.normals,n=s.indices,a=s.edgeIndices,h=s.meshPositions,l=s.meshIndices,u=s.meshEdgesIndices,c=s.meshColors,p=JSON.parse(s.entityIDs),d=s.entityMeshes,m=s.entityIsObjects,g=h.length,_=d.length;for(let y=0;y<_;y++){const v=p[y],w=t.globalizeObjectIds?f.globalizeObjectId(i.id,v):v,P=e.metaScene.metaObjects[w],T={},x={};if(P){if(t.excludeTypesMap&&P.type&&t.excludeTypesMap[P.type])continue;if(t.includeTypesMap&&P.type&&!t.includeTypesMap[P.type])continue;const e=t.objectDefaults?t.objectDefaults[P.type]||t.objectDefaults.DEFAULT:null;e&&(!1===e.visible&&(T.visible=!1),!1===e.pickable&&(T.pickable=!1),e.colorize&&(x.color=e.colorize),void 0!==e.opacity&&null!==e.opacity&&(x.opacity=e.opacity));}else if(t.excludeUnclassifiedObjects)continue;const M=y===_-1,D=[];for(let e=d[y],t=M?d.length:d[y+1];e<t;e++){const t=e===g-1,p=w+".mesh."+e,d=mg(c.subarray(4*e,4*e+3)),f=c[4*e+3]/255;i.createMesh(b.apply(x,{id:p,primitive:"triangles",positionsCompressed:r.subarray(h[e],t?r.length:h[e+1]),normalsCompressed:o.subarray(h[e],t?r.length:h[e+1]),indices:n.subarray(l[e],t?n.length:l[e+1]),edgeIndices:a.subarray(u[e],t?a.length:u[e+1]),positionsDecodeMatrix:s.positionsDecodeMatrix,color:d,opacity:f})),D.push(p);}i.createEntity(b.apply(T,{id:w,isObject:1===m[y],meshIds:D}));}}(e,t,o,i);}};let _g=window.pako||dg;_g.inflate||(_g=_g.default);const yg=function(){const e=new Float32Array(3);return function(t){return e[0]=t[0]/255,e[1]=t[1]/255,e[2]=t[2]/255,e}}();const vg={version:2,parse:function(e,t,s,i){const r=function(e){return {positions:e[0],normals:e[1],indices:e[2],edgeIndices:e[3],meshPositions:e[4],meshIndices:e[5],meshEdgesIndices:e[6],meshColors:e[7],entityIDs:e[8],entityMeshes:e[9],entityIsObjects:e[10],positionsDecodeMatrix:e[11],entityMeshIds:e[12],entityMatrices:e[13],entityUsesInstancing:e[14]}}(s),o=function(e){return {positions:new Uint16Array(_g.inflate(e.positions).buffer),normals:new Int8Array(_g.inflate(e.normals).buffer),indices:new Uint32Array(_g.inflate(e.indices).buffer),edgeIndices:new Uint32Array(_g.inflate(e.edgeIndices).buffer),meshPositions:new Uint32Array(_g.inflate(e.meshPositions).buffer),meshIndices:new Uint32Array(_g.inflate(e.meshIndices).buffer),meshEdgesIndices:new Uint32Array(_g.inflate(e.meshEdgesIndices).buffer),meshColors:new Uint8Array(_g.inflate(e.meshColors).buffer),entityIDs:_g.inflate(e.entityIDs,{to:"string"}),entityMeshes:new Uint32Array(_g.inflate(e.entityMeshes).buffer),entityIsObjects:new Uint8Array(_g.inflate(e.entityIsObjects).buffer),positionsDecodeMatrix:new Float32Array(_g.inflate(e.positionsDecodeMatrix).buffer),entityMeshIds:new Uint32Array(_g.inflate(e.entityMeshIds).buffer),entityMatrices:new Float32Array(_g.inflate(e.entityMatrices).buffer),entityUsesInstancing:new Uint8Array(_g.inflate(e.entityUsesInstancing).buffer)}}(r);!function(e,t,s,i){i.positionsCompression="precompressed",i.normalsCompression="precompressed";const r=s.positions,o=s.normals,n=s.indices,a=s.edgeIndices,h=s.meshPositions,l=s.meshIndices,u=s.meshEdgesIndices,c=s.meshColors,p=JSON.parse(s.entityIDs),d=s.entityMeshes,m=s.entityIsObjects,g=s.entityMeshIds,_=s.entityMatrices,y=s.entityUsesInstancing,v=h.length,w=d.length,P={};for(let T=0;T<w;T++){const x=p[T],M=t.globalizeObjectIds?f.globalizeObjectId(i.id,x):x,D=e.metaScene.metaObjects[M],A={},C={},I=_.subarray(16*T,16*T+16);if(D){if(t.excludeTypesMap&&D.type&&t.excludeTypesMap[D.type])continue;if(t.includeTypesMap&&D.type&&!t.includeTypesMap[D.type])continue;const e=t.objectDefaults?t.objectDefaults[D.type]||t.objectDefaults.DEFAULT:null;e&&(!1===e.visible&&(A.visible=!1),!1===e.pickable&&(A.pickable=!1),e.colorize&&(C.color=e.colorize),void 0!==e.opacity&&null!==e.opacity&&(C.opacity=e.opacity));}else if(t.excludeUnclassifiedObjects)continue;const F=T===w-1,B=[];for(let e=d[T],t=F?g.length:d[T+1];e<t;e++){const t=g[e],p=t===v-1,d=M+".mesh."+t,f=yg(c.subarray(4*t,4*t+3)),m=c[4*t+3]/255,_=r.subarray(h[t],p?r.length:h[t+1]),w=o.subarray(h[t],p?r.length:h[t+1]),x=n.subarray(l[t],p?n.length:l[t+1]),D=a.subarray(u[t],p?a.length:u[t+1]);if(1===y[T]){const e="geometry."+t;e in P||(i.createGeometry({id:e,positionsCompressed:_,normalsCompressed:w,indices:x,edgeIndices:D,primitive:"triangles",positionsDecodeMatrix:s.positionsDecodeMatrix}),P[e]=!0),i.createMesh(b.apply(C,{id:d,color:f,opacity:m,matrix:I,geometryId:e})),B.push(d);}else i.createMesh(b.apply(C,{id:d,primitive:"triangles",positionsCompressed:_,normalsCompressed:w,indices:x,edgeIndices:D,positionsDecodeMatrix:s.positionsDecodeMatrix,color:f,opacity:m})),B.push(d);}B.length&&i.createEntity(b.apply(A,{id:M,isObject:1===m[T],meshIds:B}));}}(e,t,o,i);}};let bg=window.pako||dg;bg.inflate||(bg=bg.default);const wg=function(){const e=new Float32Array(3);return function(t){return e[0]=t[0]/255,e[1]=t[1]/255,e[2]=t[2]/255,e}}();const Pg={version:3,parse:function(e,t,s,i){const r=function(e){return {positions:e[0],normals:e[1],indices:e[2],edgeIndices:e[3],meshPositions:e[4],meshIndices:e[5],meshEdgesIndices:e[6],meshColors:e[7],entityIDs:e[8],entityMeshes:e[9],entityIsObjects:e[10],instancedPositionsDecodeMatrix:e[11],batchedPositionsDecodeMatrix:e[12],entityMeshIds:e[13],entityMatrices:e[14],entityUsesInstancing:e[15]}}(s),o=function(e){return {positions:new Uint16Array(bg.inflate(e.positions).buffer),normals:new Int8Array(bg.inflate(e.normals).buffer),indices:new Uint32Array(bg.inflate(e.indices).buffer),edgeIndices:new Uint32Array(bg.inflate(e.edgeIndices).buffer),meshPositions:new Uint32Array(bg.inflate(e.meshPositions).buffer),meshIndices:new Uint32Array(bg.inflate(e.meshIndices).buffer),meshEdgesIndices:new Uint32Array(bg.inflate(e.meshEdgesIndices).buffer),meshColors:new Uint8Array(bg.inflate(e.meshColors).buffer),entityIDs:bg.inflate(e.entityIDs,{to:"string"}),entityMeshes:new Uint32Array(bg.inflate(e.entityMeshes).buffer),entityIsObjects:new Uint8Array(bg.inflate(e.entityIsObjects).buffer),instancedPositionsDecodeMatrix:new Float32Array(bg.inflate(e.instancedPositionsDecodeMatrix).buffer),batchedPositionsDecodeMatrix:new Float32Array(bg.inflate(e.batchedPositionsDecodeMatrix).buffer),entityMeshIds:new Uint32Array(bg.inflate(e.entityMeshIds).buffer),entityMatrices:new Float32Array(bg.inflate(e.entityMatrices).buffer),entityUsesInstancing:new Uint8Array(bg.inflate(e.entityUsesInstancing).buffer)}}(r);!function(e,t,s,i){i.positionsCompression="precompressed",i.normalsCompression="precompressed";const r=s.positions,o=s.normals,n=s.indices,a=s.edgeIndices,h=s.meshPositions,l=s.meshIndices,u=s.meshEdgesIndices,c=s.meshColors,p=JSON.parse(s.entityIDs),d=s.entityMeshes,m=s.entityIsObjects,g=s.entityMeshIds,_=s.entityMatrices,y=s.entityUsesInstancing,v=h.length,w=d.length,P={};for(let I=0;I<w;I++){const F=p[I],B=t.globalizeObjectIds?f.globalizeObjectId(i.id,F):F,E=e.metaScene.metaObjects[B],S={},R={},O=_.subarray(16*I,16*I+16);if(E){if(t.excludeTypesMap&&E.type&&t.excludeTypesMap[E.type])continue;if(t.includeTypesMap&&E.type&&!t.includeTypesMap[E.type])continue;const e=t.objectDefaults?t.objectDefaults[E.type]||t.objectDefaults.DEFAULT:null;e&&(!1===e.visible&&(S.visible=!1),!1===e.pickable&&(S.pickable=!1),e.colorize&&(R.color=e.colorize),void 0!==e.opacity&&null!==e.opacity&&(R.opacity=e.opacity));}else if(t.excludeUnclassifiedObjects)continue;const L=I===w-1,N=[];for(let e=d[I],t=L?g.length:d[I+1];e<t;e++){var T=g[e];const t=T===v-1,p=B+".mesh."+T,d=wg(c.subarray(4*T,4*T+3)),f=c[4*T+3]/255;var x=r.subarray(h[T],t?r.length:h[T+1]),M=o.subarray(h[T],t?r.length:h[T+1]),D=n.subarray(l[T],t?n.length:l[T+1]),A=a.subarray(u[T],t?a.length:u[T+1]);if(1===y[I]){var C="geometry."+T;C in P||(i.createGeometry({id:C,positionsCompressed:x,normalsCompressed:M,indices:D,edgeIndices:A,primitive:"triangles",positionsDecodeMatrix:s.instancedPositionsDecodeMatrix}),P[C]=!0),i.createMesh(b.apply(R,{id:p,color:d,opacity:f,matrix:O,geometryId:C})),N.push(p);}else i.createMesh(b.apply(R,{id:p,primitive:"triangles",positionsCompressed:x,normalsCompressed:M,indices:D,edgeIndices:A,positionsDecodeMatrix:s.batchedPositionsDecodeMatrix,color:d,opacity:f})),N.push(p);}N.length&&i.createEntity(b.apply(S,{id:B,isObject:1===m[I],meshIds:N}));}}(e,t,o,i);}};let Tg=window.pako||dg;Tg.inflate||(Tg=Tg.default);const xg=function(){const e=new Float32Array(3);return function(t){return e[0]=t[0]/255,e[1]=t[1]/255,e[2]=t[2]/255,e}}();const Mg={version:4,parse:function(e,t,s,i){const r=function(e){return {positions:e[0],normals:e[1],indices:e[2],edgeIndices:e[3],decodeMatrices:e[4],matrices:e[5],eachPrimitivePositionsAndNormalsPortion:e[6],eachPrimitiveIndicesPortion:e[7],eachPrimitiveEdgeIndicesPortion:e[8],eachPrimitiveDecodeMatricesPortion:e[9],eachPrimitiveColor:e[10],primitiveInstances:e[11],eachEntityId:e[12],eachEntityPrimitiveInstancesPortion:e[13],eachEntityMatricesPortion:e[14],eachEntityMatrix:e[15]}}(s),o=function(e){return {positions:new Uint16Array(Tg.inflate(e.positions).buffer),normals:new Int8Array(Tg.inflate(e.normals).buffer),indices:new Uint32Array(Tg.inflate(e.indices).buffer),edgeIndices:new Uint32Array(Tg.inflate(e.edgeIndices).buffer),decodeMatrices:new Float32Array(Tg.inflate(e.decodeMatrices).buffer),matrices:new Float32Array(Tg.inflate(e.matrices).buffer),eachPrimitivePositionsAndNormalsPortion:new Uint32Array(Tg.inflate(e.eachPrimitivePositionsAndNormalsPortion).buffer),eachPrimitiveIndicesPortion:new Uint32Array(Tg.inflate(e.eachPrimitiveIndicesPortion).buffer),eachPrimitiveEdgeIndicesPortion:new Uint32Array(Tg.inflate(e.eachPrimitiveEdgeIndicesPortion).buffer),eachPrimitiveDecodeMatricesPortion:new Uint32Array(Tg.inflate(e.eachPrimitiveDecodeMatricesPortion).buffer),eachPrimitiveColor:new Uint8Array(Tg.inflate(e.eachPrimitiveColor).buffer),primitiveInstances:new Uint32Array(Tg.inflate(e.primitiveInstances).buffer),eachEntityId:Tg.inflate(e.eachEntityId,{to:"string"}),eachEntityPrimitiveInstancesPortion:new Uint32Array(Tg.inflate(e.eachEntityPrimitiveInstancesPortion).buffer),eachEntityMatricesPortion:new Uint32Array(Tg.inflate(e.eachEntityMatricesPortion).buffer)}}(r);!function(e,t,s,i){i.positionsCompression="precompressed",i.normalsCompression="precompressed";const r=s.positions,o=s.normals,n=s.indices,a=s.edgeIndices,h=s.decodeMatrices,l=s.matrices,u=s.eachPrimitivePositionsAndNormalsPortion,c=s.eachPrimitiveIndicesPortion,p=s.eachPrimitiveEdgeIndicesPortion,d=s.eachPrimitiveDecodeMatricesPortion,f=s.eachPrimitiveColor,m=s.primitiveInstances,g=JSON.parse(s.eachEntityId),_=s.eachEntityPrimitiveInstancesPortion,y=s.eachEntityMatricesPortion,v=u.length,w=m.length,P=new Uint8Array(v),T=new Uint32Array(v),x=g.length;for(let e=0;e<v;e++)T[e]=e;T.sort(((e,t)=>d[e]<d[t]?-1:d[e]>d[t]?1:0));for(let e=0;e<w;e++)P[m[e]]++;const M={};for(let e=0;e<x;e++){const t=x-1,s=e===t,i=_[e],r=s?_[t]:_[e+1];for(let t=i;t<r;t++){const s=m[t];P[s]>1||(M[s]=e);}}for(let e=0;e<v;e++){const t=T[e],s=t===v-1,l=P[t]>1,m=xg(f.subarray(4*t,4*t+3)),_=f[4*t+3]/255,y=r.subarray(u[t],s?r.length:u[t+1]),w=o.subarray(u[t],s?o.length:u[t+1]),x=n.subarray(c[t],s?n.length:c[t+1]),A=a.subarray(p[t],s?a.length:p[t+1]),C=h.subarray(d[t],d[t]+16);if(l){var D="geometry"+t;i.createGeometry({id:D,primitive:"triangles",positionsCompressed:y,normalsCompressed:w,indices:x,edgeIndices:A,positionsDecodeMatrix:C});}else {const e=t;g[M[t]];const s={};i.createMesh(b.apply(s,{id:e,primitive:"triangles",positionsCompressed:y,normalsCompressed:w,indices:x,edgeIndices:A,positionsDecodeMatrix:C,color:m,opacity:_}));}}let A=0;for(let e=0;e<x;e++){const t=x-1,s=e===t,r=g[e],o=_[e],n=s?_[t]:_[e+1],a=[];for(let t=o;t<n;t++){const s=m[t];if(P[s]>1){const t={},r="instance."+A++,o="geometry"+s,n=16*y[e],h=l.subarray(n,n+16);i.createMesh(b.apply(t,{id:r,geometryId:o,matrix:h})),a.push(r);}else a.push(s);}if(a.length>0){const e={};i.createEntity(b.apply(e,{id:r,isObject:!0,meshIds:a}));}}}(0,0,o,i);}};let Dg=window.pako||dg;Dg.inflate||(Dg=Dg.default);const Ag=function(){const e=new Float32Array(3);return function(t){return e[0]=t[0]/255,e[1]=t[1]/255,e[2]=t[2]/255,e}}();const Cg={version:5,parse:function(e,t,s,i){const r=function(e){return {positions:e[0],normals:e[1],indices:e[2],edgeIndices:e[3],matrices:e[4],eachPrimitivePositionsAndNormalsPortion:e[5],eachPrimitiveIndicesPortion:e[6],eachPrimitiveEdgeIndicesPortion:e[7],eachPrimitiveColor:e[8],primitiveInstances:e[9],eachEntityId:e[10],eachEntityPrimitiveInstancesPortion:e[11],eachEntityMatricesPortion:e[12]}}(s),o=function(e){return {positions:new Float32Array(Dg.inflate(e.positions).buffer),normals:new Int8Array(Dg.inflate(e.normals).buffer),indices:new Uint32Array(Dg.inflate(e.indices).buffer),edgeIndices:new Uint32Array(Dg.inflate(e.edgeIndices).buffer),matrices:new Float32Array(Dg.inflate(e.matrices).buffer),eachPrimitivePositionsAndNormalsPortion:new Uint32Array(Dg.inflate(e.eachPrimitivePositionsAndNormalsPortion).buffer),eachPrimitiveIndicesPortion:new Uint32Array(Dg.inflate(e.eachPrimitiveIndicesPortion).buffer),eachPrimitiveEdgeIndicesPortion:new Uint32Array(Dg.inflate(e.eachPrimitiveEdgeIndicesPortion).buffer),eachPrimitiveColor:new Uint8Array(Dg.inflate(e.eachPrimitiveColor).buffer),primitiveInstances:new Uint32Array(Dg.inflate(e.primitiveInstances).buffer),eachEntityId:Dg.inflate(e.eachEntityId,{to:"string"}),eachEntityPrimitiveInstancesPortion:new Uint32Array(Dg.inflate(e.eachEntityPrimitiveInstancesPortion).buffer),eachEntityMatricesPortion:new Uint32Array(Dg.inflate(e.eachEntityMatricesPortion).buffer)}}(r);!function(e,t,s,i){i.positionsCompression="disabled",i.normalsCompression="precompressed";const r=s.positions,o=s.normals,n=s.indices,a=s.edgeIndices,h=s.matrices,l=s.eachPrimitivePositionsAndNormalsPortion,u=s.eachPrimitiveIndicesPortion,c=s.eachPrimitiveEdgeIndicesPortion,p=s.eachPrimitiveColor,d=s.primitiveInstances,f=JSON.parse(s.eachEntityId),m=s.eachEntityPrimitiveInstancesPortion,g=s.eachEntityMatricesPortion,_=l.length,y=d.length,v=new Uint8Array(_),w=f.length;for(let e=0;e<y;e++)v[d[e]]++;const P={};for(let e=0;e<w;e++){const t=w-1,s=e===t,i=m[e],r=s?m[t]:m[e+1];for(let t=i;t<r;t++){const s=d[t];v[s]>1||(P[s]=e);}}for(let e=0;e<_;e++){const t=e===_-1,s=v[e]>1,h=Ag(p.subarray(4*e,4*e+3)),d=p[4*e+3]/255,m=r.subarray(l[e],t?r.length:l[e+1]),g=o.subarray(l[e],t?o.length:l[e+1]),y=n.subarray(u[e],t?n.length:u[e+1]),w=a.subarray(c[e],t?a.length:c[e+1]);if(s){var T="geometry"+e;i.createGeometry({id:T,primitive:"triangles",positionsCompressed:m,normalsCompressed:g,indices:y,edgeIndices:w});}else {const t=e;f[P[e]];const s={};i.createMesh(b.apply(s,{id:t,primitive:"triangles",positionsCompressed:m,normalsCompressed:g,indices:y,edgeIndices:w,color:h,opacity:d}));}}let x=0;for(let e=0;e<w;e++){const t=w-1,s=e===t,r=f[e],o=m[e],n=s?m[t]:m[e+1],a=[];for(let t=o;t<n;t++){const s=d[t];if(v[s]>1){const t={},r="instance."+x++,o="geometry"+s,n=16*g[e],l=h.subarray(n,n+16);i.createMesh(b.apply(t,{id:r,geometryId:o,matrix:l})),a.push(r);}else a.push(s);}if(a.length>0){const e={};i.createEntity(b.apply(e,{id:r,isObject:!0,meshIds:a}));}}}(0,0,o,i);}};let Ig=window.pako||dg;Ig.inflate||(Ig=Ig.default);const Fg=function(){const e=new Float32Array(3);return function(t){return e[0]=t[0]/255,e[1]=t[1]/255,e[2]=t[2]/255,e}}();const Bg={version:6,parse:function(e,t,s,i){const r=function(e){return {positions:e[0],normals:e[1],indices:e[2],edgeIndices:e[3],matrices:e[4],reusedPrimitivesDecodeMatrix:e[5],eachPrimitivePositionsAndNormalsPortion:e[6],eachPrimitiveIndicesPortion:e[7],eachPrimitiveEdgeIndicesPortion:e[8],eachPrimitiveColorAndOpacity:e[9],primitiveInstances:e[10],eachEntityId:e[11],eachEntityPrimitiveInstancesPortion:e[12],eachEntityMatricesPortion:e[13],eachTileAABB:e[14],eachTileEntitiesPortion:e[15]}}(s),o=function(e){function t(e,t){return 0===e.length?[]:Ig.inflate(e,t).buffer}return {positions:new Uint16Array(t(e.positions)),normals:new Int8Array(t(e.normals)),indices:new Uint32Array(t(e.indices)),edgeIndices:new Uint32Array(t(e.edgeIndices)),matrices:new Float32Array(t(e.matrices)),reusedPrimitivesDecodeMatrix:new Float32Array(t(e.reusedPrimitivesDecodeMatrix)),eachPrimitivePositionsAndNormalsPortion:new Uint32Array(t(e.eachPrimitivePositionsAndNormalsPortion)),eachPrimitiveIndicesPortion:new Uint32Array(t(e.eachPrimitiveIndicesPortion)),eachPrimitiveEdgeIndicesPortion:new Uint32Array(t(e.eachPrimitiveEdgeIndicesPortion)),eachPrimitiveColorAndOpacity:new Uint8Array(t(e.eachPrimitiveColorAndOpacity)),primitiveInstances:new Uint32Array(t(e.primitiveInstances)),eachEntityId:Ig.inflate(e.eachEntityId,{to:"string"}),eachEntityPrimitiveInstancesPortion:new Uint32Array(t(e.eachEntityPrimitiveInstancesPortion)),eachEntityMatricesPortion:new Uint32Array(t(e.eachEntityMatricesPortion)),eachTileAABB:new Float64Array(t(e.eachTileAABB)),eachTileEntitiesPortion:new Uint32Array(t(e.eachTileEntitiesPortion))}}(r);!function(e,t,s,i){const r=s.positions,o=s.normals,n=s.indices,a=s.edgeIndices,h=s.matrices,l=s.reusedPrimitivesDecodeMatrix,u=s.eachPrimitivePositionsAndNormalsPortion,c=s.eachPrimitiveIndicesPortion,p=s.eachPrimitiveEdgeIndicesPortion,d=s.eachPrimitiveColorAndOpacity,m=s.primitiveInstances,g=JSON.parse(s.eachEntityId),_=s.eachEntityPrimitiveInstancesPortion,y=s.eachEntityMatricesPortion,v=s.eachTileAABB,w=s.eachTileEntitiesPortion,P=u.length,T=m.length,x=g.length,M=w.length;let D=0;const A=new Uint32Array(P);for(let e=0;e<T;e++){const t=m[e];void 0!==A[t]?A[t]++:A[t]=1;}const C=f.vec3(),I=f.AABB3();for(let s=0;s<M;s++){const T=s===M-1,F=w[s],B=T?x:w[s+1],E=6*s,S=v.subarray(E,E+6);f.getAABB3Center(S,C),I[0]=S[0]-C[0],I[1]=S[1]-C[1],I[2]=S[2]-C[2],I[3]=S[3]-C[0],I[4]=S[4]-C[1],I[5]=S[5]-C[2];const R=Pt.createPositionsDecodeMatrix(I),O={};for(let v=F;v<B;v++){const w=g[v],T=t.globalizeObjectIds?f.globalizeObjectId(i.id,w):w,M=y[v],I=h.slice(M,M+16),F=v===x-1,B=_[v],E=F?m.length:_[v+1],S=[],L=e.metaScene.metaObjects[T],N={},k={};if(L){if(t.excludeTypesMap&&L.type&&t.excludeTypesMap[L.type])continue;if(t.includeTypesMap&&L.type&&!t.includeTypesMap[L.type])continue;const e=t.objectDefaults?t.objectDefaults[L.type]||t.objectDefaults.DEFAULT:null;e&&(!1===e.visible&&(N.visible=!1),!1===e.pickable&&(N.pickable=!1),e.colorize&&(k.color=e.colorize),void 0!==e.opacity&&null!==e.opacity&&(k.opacity=e.opacity));}else if(t.excludeUnclassifiedObjects)continue;for(let e=B;e<E;e++){const t=m[e],h=A[t]>1,f=t===P-1,g=r.subarray(u[t],f?r.length:u[t+1]),_=o.subarray(u[t],f?o.length:u[t+1]),y=n.subarray(c[t],f?n.length:c[t+1]),v=a.subarray(p[t],f?a.length:p[t+1]),w=Fg(d.subarray(4*t,4*t+3)),T=d[4*t+3]/255,x=D++;if(h){const e="geometry."+s+"."+t;O[e]||(i.createGeometry({id:e,primitive:"triangles",positionsCompressed:g,normalsCompressed:_,indices:y,edgeIndices:v,positionsDecodeMatrix:l}),O[e]=!0),i.createMesh(b.apply(k,{id:x,geometryId:e,origin:C,matrix:I,color:w,opacity:T})),S.push(x);}else i.createMesh(b.apply(k,{id:x,origin:C,primitive:"triangles",positionsCompressed:g,normalsCompressed:_,indices:y,edgeIndices:v,positionsDecodeMatrix:R,color:w,opacity:T})),S.push(x);}S.length>0&&i.createEntity(b.apply(N,{id:T,isObject:!0,meshIds:S}));}}}(e,t,o,i);}};let Eg=window.pako||dg;Eg.inflate||(Eg=Eg.default);const Sg=function(){const e=new Float32Array(3);return function(t){return e[0]=t[0]/255,e[1]=t[1]/255,e[2]=t[2]/255,e}}();function Rg(e){const t=[];for(let s=0,i=e.length;s<i;s+=3)t.push(e[s]),t.push(e[s+1]),t.push(e[s+2]),t.push(1);return t}const Og={version:7,parse:function(e,t,s,i){const r=function(e){return {positions:e[0],normals:e[1],colors:e[2],indices:e[3],edgeIndices:e[4],matrices:e[5],reusedGeometriesDecodeMatrix:e[6],eachGeometryPrimitiveType:e[7],eachGeometryPositionsPortion:e[8],eachGeometryNormalsPortion:e[9],eachGeometryColorsPortion:e[10],eachGeometryIndicesPortion:e[11],eachGeometryEdgeIndicesPortion:e[12],eachMeshGeometriesPortion:e[13],eachMeshMatricesPortion:e[14],eachMeshMaterial:e[15],eachEntityId:e[16],eachEntityMeshesPortion:e[17],eachTileAABB:e[18],eachTileEntitiesPortion:e[19]}}(s),o=function(e){function t(e,t){return 0===e.length?[]:Eg.inflate(e,t).buffer}return {positions:new Uint16Array(t(e.positions)),normals:new Int8Array(t(e.normals)),colors:new Uint8Array(t(e.colors)),indices:new Uint32Array(t(e.indices)),edgeIndices:new Uint32Array(t(e.edgeIndices)),matrices:new Float32Array(t(e.matrices)),reusedGeometriesDecodeMatrix:new Float32Array(t(e.reusedGeometriesDecodeMatrix)),eachGeometryPrimitiveType:new Uint8Array(t(e.eachGeometryPrimitiveType)),eachGeometryPositionsPortion:new Uint32Array(t(e.eachGeometryPositionsPortion)),eachGeometryNormalsPortion:new Uint32Array(t(e.eachGeometryNormalsPortion)),eachGeometryColorsPortion:new Uint32Array(t(e.eachGeometryColorsPortion)),eachGeometryIndicesPortion:new Uint32Array(t(e.eachGeometryIndicesPortion)),eachGeometryEdgeIndicesPortion:new Uint32Array(t(e.eachGeometryEdgeIndicesPortion)),eachMeshGeometriesPortion:new Uint32Array(t(e.eachMeshGeometriesPortion)),eachMeshMatricesPortion:new Uint32Array(t(e.eachMeshMatricesPortion)),eachMeshMaterial:new Uint8Array(t(e.eachMeshMaterial)),eachEntityId:Eg.inflate(e.eachEntityId,{to:"string"}),eachEntityMeshesPortion:new Uint32Array(t(e.eachEntityMeshesPortion)),eachTileAABB:new Float64Array(t(e.eachTileAABB)),eachTileEntitiesPortion:new Uint32Array(t(e.eachTileEntitiesPortion))}}(r);!function(e,t,s,i){const r=s.positions,o=s.normals,n=s.colors,a=s.indices,h=s.edgeIndices,l=s.matrices,u=s.reusedGeometriesDecodeMatrix,c=s.eachGeometryPrimitiveType,p=s.eachGeometryPositionsPortion,d=s.eachGeometryNormalsPortion,m=s.eachGeometryColorsPortion,g=s.eachGeometryIndicesPortion,_=s.eachGeometryEdgeIndicesPortion,y=s.eachMeshGeometriesPortion,v=s.eachMeshMatricesPortion,w=s.eachMeshMaterial,P=JSON.parse(s.eachEntityId),T=s.eachEntityMeshesPortion,x=s.eachTileAABB,M=s.eachTileEntitiesPortion,D=p.length,A=y.length,C=P.length,I=M.length;let F=0;const B=new Uint32Array(D);for(let e=0;e<A;e++){const t=y[e];void 0!==B[t]?B[t]++:B[t]=1;}const E=f.vec3(),S=f.AABB3();for(let s=0;s<I;s++){const A=s===I-1,R=M[s],O=A?C:M[s+1],L=6*s,N=x.subarray(L,L+6);f.getAABB3Center(N,E),S[0]=N[0]-E[0],S[1]=N[1]-E[1],S[2]=N[2]-E[2],S[3]=N[3]-E[0],S[4]=N[4]-E[1],S[5]=N[5]-E[2];const k=Pt.createPositionsDecodeMatrix(S),j={};for(let x=R;x<O;x++){const M=P[x],A=t.globalizeObjectIds?f.globalizeObjectId(i.id,M):M,I=x===C-1,S=T[x],R=I?y.length:T[x+1],O=[],L=e.metaScene.metaObjects[A],N={},G={};if(L){if(t.excludeTypesMap&&L.type&&t.excludeTypesMap[L.type])continue;if(t.includeTypesMap&&L.type&&!t.includeTypesMap[L.type])continue;const e=t.objectDefaults?t.objectDefaults[L.type]||t.objectDefaults.DEFAULT:null;e&&(!1===e.visible&&(N.visible=!1),!1===e.pickable&&(N.pickable=!1),e.colorize&&(G.color=e.colorize),void 0!==e.opacity&&null!==e.opacity&&(G.opacity=e.opacity),void 0!==e.metallic&&null!==e.metallic&&(G.metallic=e.metallic),void 0!==e.roughness&&null!==e.roughness&&(G.roughness=e.roughness));}else if(t.excludeUnclassifiedObjects)continue;for(let e=S;e<R;e++){const t=y[e],f=B[t]>1,P=t===D-1,T=Sg(w.subarray(6*e,6*e+3)),x=w[6*e+3]/255,M=w[6*e+4]/255,A=w[6*e+5]/255,C=F++;if(f){const f=v[e],y=l.slice(f,f+16),w="geometry."+s+"."+t;if(!j[w]){let e,s,l,f,y,v;switch(c[t]){case 0:e="solid",s=r.subarray(p[t],P?r.length:p[t+1]),l=o.subarray(d[t],P?o.length:d[t+1]),y=a.subarray(g[t],P?a.length:g[t+1]),v=h.subarray(_[t],P?h.length:_[t+1]);break;case 1:e="surface",s=r.subarray(p[t],P?r.length:p[t+1]),l=o.subarray(d[t],P?o.length:d[t+1]),y=a.subarray(g[t],P?a.length:g[t+1]),v=h.subarray(_[t],P?h.length:_[t+1]);break;case 2:e="points",s=r.subarray(p[t],P?r.length:p[t+1]),f=Rg(n.subarray(m[t],P?n.length:m[t+1]));break;case 3:e="lines",s=r.subarray(p[t],P?r.length:p[t+1]),y=a.subarray(g[t],P?a.length:g[t+1]);break;default:continue}i.createGeometry({id:w,primitive:e,positionsCompressed:s,normalsCompressed:l,colors:f,indices:y,edgeIndices:v,positionsDecodeMatrix:u}),j[w]=!0;}i.createMesh(b.apply(G,{id:C,geometryId:w,origin:E,matrix:y,color:T,metallic:M,roughness:A,opacity:x})),O.push(C);}else {let e,s,l,u,f,y;switch(c[t]){case 0:e="solid",s=r.subarray(p[t],P?r.length:p[t+1]),l=o.subarray(d[t],P?o.length:d[t+1]),f=a.subarray(g[t],P?a.length:g[t+1]),y=h.subarray(_[t],P?h.length:_[t+1]);break;case 1:e="surface",s=r.subarray(p[t],P?r.length:p[t+1]),l=o.subarray(d[t],P?o.length:d[t+1]),f=a.subarray(g[t],P?a.length:g[t+1]),y=h.subarray(_[t],P?h.length:_[t+1]);break;case 2:e="points",s=r.subarray(p[t],P?r.length:p[t+1]),u=Rg(n.subarray(m[t],P?n.length:m[t+1]));break;case 3:e="lines",s=r.subarray(p[t],P?r.length:p[t+1]),f=a.subarray(g[t],P?a.length:g[t+1]);break;default:continue}i.createMesh(b.apply(G,{id:C,origin:E,primitive:e,positionsCompressed:s,normalsCompressed:l,colors:u,indices:f,edgeIndices:y,positionsDecodeMatrix:k,color:T,metallic:M,roughness:A,opacity:x})),O.push(C);}}O.length>0&&i.createEntity(b.apply(N,{id:A,isObject:!0,meshIds:O}));}}}(e,t,o,i);}};let Lg=window.pako||dg;Lg.inflate||(Lg=Lg.default);const Ng=f.vec4(),kg=f.vec4();const jg=function(){const e=new Float32Array(3);return function(t){return e[0]=t[0]/255,e[1]=t[1]/255,e[2]=t[2]/255,e}}();function Gg(e){const t=[];for(let s=0,i=e.length;s<i;s+=3)t.push(e[s]),t.push(e[s+1]),t.push(e[s+2]),t.push(1);return t}const Hg={version:8,parse:function(e,t,s,i){const r=function(e){return {types:e[0],eachMetaObjectId:e[1],eachMetaObjectType:e[2],eachMetaObjectName:e[3],eachMetaObjectParent:e[4],positions:e[5],normals:e[6],colors:e[7],indices:e[8],edgeIndices:e[9],matrices:e[10],reusedGeometriesDecodeMatrix:e[11],eachGeometryPrimitiveType:e[12],eachGeometryPositionsPortion:e[13],eachGeometryNormalsPortion:e[14],eachGeometryColorsPortion:e[15],eachGeometryIndicesPortion:e[16],eachGeometryEdgeIndicesPortion:e[17],eachMeshGeometriesPortion:e[18],eachMeshMatricesPortion:e[19],eachMeshMaterial:e[20],eachEntityMetaObject:e[21],eachEntityMeshesPortion:e[22],eachTileAABB:e[23],eachTileEntitiesPortion:e[24]}}(s),o=function(e){function t(e,t){return 0===e.length?[]:Lg.inflate(e,t).buffer}return {types:Lg.inflate(e.types,{to:"string"}),eachMetaObjectId:Lg.inflate(e.eachMetaObjectId,{to:"string"}),eachMetaObjectType:new Uint32Array(t(e.eachMetaObjectType)),eachMetaObjectName:Lg.inflate(e.eachMetaObjectName,{to:"string"}),eachMetaObjectParent:new Uint32Array(t(e.eachMetaObjectParent)),positions:new Uint16Array(t(e.positions)),normals:new Int8Array(t(e.normals)),colors:new Uint8Array(t(e.colors)),indices:new Uint32Array(t(e.indices)),edgeIndices:new Uint32Array(t(e.edgeIndices)),matrices:new Float32Array(t(e.matrices)),reusedGeometriesDecodeMatrix:new Float32Array(t(e.reusedGeometriesDecodeMatrix)),eachGeometryPrimitiveType:new Uint8Array(t(e.eachGeometryPrimitiveType)),eachGeometryPositionsPortion:new Uint32Array(t(e.eachGeometryPositionsPortion)),eachGeometryNormalsPortion:new Uint32Array(t(e.eachGeometryNormalsPortion)),eachGeometryColorsPortion:new Uint32Array(t(e.eachGeometryColorsPortion)),eachGeometryIndicesPortion:new Uint32Array(t(e.eachGeometryIndicesPortion)),eachGeometryEdgeIndicesPortion:new Uint32Array(t(e.eachGeometryEdgeIndicesPortion)),eachMeshGeometriesPortion:new Uint32Array(t(e.eachMeshGeometriesPortion)),eachMeshMatricesPortion:new Uint32Array(t(e.eachMeshMatricesPortion)),eachMeshMaterial:new Uint8Array(t(e.eachMeshMaterial)),eachEntityMetaObject:new Uint32Array(t(e.eachEntityMetaObject)),eachEntityMeshesPortion:new Uint32Array(t(e.eachEntityMeshesPortion)),eachTileAABB:new Float64Array(t(e.eachTileAABB)),eachTileEntitiesPortion:new Uint32Array(t(e.eachTileEntitiesPortion))}}(r);!function(e,t,s,i){const r=JSON.parse(s.types),o=JSON.parse(s.eachMetaObjectId),n=s.eachMetaObjectType,a=JSON.parse(s.eachMetaObjectName),h=s.eachMetaObjectParent,l=s.positions,u=s.normals,c=s.colors,p=s.indices,d=s.edgeIndices,m=s.matrices,g=s.reusedGeometriesDecodeMatrix,_=s.eachGeometryPrimitiveType,y=s.eachGeometryPositionsPortion,v=s.eachGeometryNormalsPortion,w=s.eachGeometryColorsPortion,P=s.eachGeometryIndicesPortion,T=s.eachGeometryEdgeIndicesPortion,x=s.eachMeshGeometriesPortion,M=s.eachMeshMatricesPortion,D=s.eachMeshMaterial,A=s.eachEntityMetaObject,C=s.eachEntityMeshesPortion,I=s.eachTileAABB,F=s.eachTileEntitiesPortion,B=o.length,E=y.length,S=x.length,R=A.length,O=F.length;let L=0;const N=i.id;if(!e.metaScene.metaModels[N]){const s={metaObjects:[]};for(let e=0;e<B;e++){const t=o[e],i=r[n[e]]||"default",l=a[e],u=h[e],c=u!==e?o[u]:null;s.metaObjects.push({id:t,type:i,name:l,parent:c});}e.metaScene.createMetaModel(N,s,{includeTypes:t.includeTypes,excludeTypes:t.excludeTypes,globalizeObjectIds:t.globalizeObjectIds}),i.once("destroyed",(()=>{e.metaScene.destroyMetaModel(N);}));}const k=new Uint32Array(E);for(let e=0;e<S;e++){const t=x[e];void 0!==k[t]?k[t]++:k[t]=1;}const j=f.vec3(),G=f.AABB3(),H={};for(let s=0;s<O;s++){const r=s===O-1,n=F[s],a=r?R:F[s+1],h=6*s,B=I.subarray(h,h+6);f.getAABB3Center(B,j),G[0]=B[0]-j[0],G[1]=B[1]-j[1],G[2]=B[2]-j[2],G[3]=B[3]-j[0],G[4]=B[4]-j[1],G[5]=B[5]-j[2];const S=Pt.createPositionsDecodeMatrix(G),N={};for(let r=n;r<a;r++){const n=o[A[r]],a=t.globalizeObjectIds?f.globalizeObjectId(i.id,n):n,h=r===R-1,I=C[r],F=h?x.length:C[r+1],B=[],O=e.metaScene.metaObjects[a],V={},U={};if(O){if(t.excludeTypesMap&&O.type&&t.excludeTypesMap[O.type])continue;if(t.includeTypesMap&&O.type&&!t.includeTypesMap[O.type])continue;const e=t.objectDefaults?t.objectDefaults[O.type]||t.objectDefaults.DEFAULT:null;e&&(!1===e.visible&&(V.visible=!1),!1===e.pickable&&(V.pickable=!1),e.colorize&&(U.color=e.colorize),void 0!==e.opacity&&null!==e.opacity&&(U.opacity=e.opacity),void 0!==e.metallic&&null!==e.metallic&&(U.metallic=e.metallic),void 0!==e.roughness&&null!==e.roughness&&(U.roughness=e.roughness));}else if(t.excludeUnclassifiedObjects)continue;for(let e=I;e<F;e++){const r=x[e],o=k[r]>1,n=r===E-1,a=jg(D.subarray(6*e,6*e+3)),h=D[6*e+3]/255,A=D[6*e+4]/255,C=D[6*e+5]/255,I=L++;if(o){const o=M[e],x=m.slice(o,o+16),D="geometry."+s+"."+r;let F=H[D];if(!F){F={batchThisMesh:!t.reuseGeometries};let e=!1;switch(_[r]){case 0:F.primitiveName="solid",F.geometryPositions=l.subarray(y[r],n?l.length:y[r+1]),F.geometryNormals=u.subarray(v[r],n?u.length:v[r+1]),F.geometryIndices=p.subarray(P[r],n?p.length:P[r+1]),F.geometryEdgeIndices=d.subarray(T[r],n?d.length:T[r+1]),e=F.geometryPositions.length>0&&F.geometryIndices.length>0;break;case 1:F.primitiveName="surface",F.geometryPositions=l.subarray(y[r],n?l.length:y[r+1]),F.geometryNormals=u.subarray(v[r],n?u.length:v[r+1]),F.geometryIndices=p.subarray(P[r],n?p.length:P[r+1]),F.geometryEdgeIndices=d.subarray(T[r],n?d.length:T[r+1]),e=F.geometryPositions.length>0&&F.geometryIndices.length>0;break;case 2:F.primitiveName="points",F.geometryPositions=l.subarray(y[r],n?l.length:y[r+1]),F.geometryColors=Gg(c.subarray(w[r],n?c.length:w[r+1])),e=F.geometryPositions.length>0;break;case 3:F.primitiveName="lines",F.geometryPositions=l.subarray(y[r],n?l.length:y[r+1]),F.geometryIndices=p.subarray(P[r],n?p.length:P[r+1]),e=F.geometryPositions.length>0&&F.geometryIndices.length>0;break;default:continue}if(e||(F=null),F&&(F.geometryPositions.length,F.batchThisMesh)){F.decompressedPositions=new Float32Array(F.geometryPositions.length);const e=F.geometryPositions,t=F.decompressedPositions;for(let s=0,i=e.length;s<i;s+=3)t[s+0]=e[s+0]*g[0]+g[12],t[s+1]=e[s+1]*g[5]+g[13],t[s+2]=e[s+2]*g[10]+g[14];F.geometryPositions=null,H[D]=F;}}if(F)if(F.batchThisMesh){const e=F.decompressedPositions,t=new Uint16Array(e.length);for(let s=0,i=e.length;s<i;s+=3)Ng[0]=e[s+0],Ng[1]=e[s+1],Ng[2]=e[s+2],Ng[3]=1,f.transformVec4(x,Ng,kg),Pt.compressPosition(kg,G,Ng),t[s+0]=Ng[0],t[s+1]=Ng[1],t[s+2]=Ng[2];i.createMesh(b.apply(U,{id:I,origin:j,primitive:F.primitiveName,positionsCompressed:t,normalsCompressed:F.geometryNormals,colorsCompressed:F.geometryColors,indices:F.geometryIndices,edgeIndices:F.geometryEdgeIndices,positionsDecodeMatrix:S,color:a,metallic:A,roughness:C,opacity:h})),B.push(I);}else N[D]||(i.createGeometry({id:D,primitive:F.primitiveName,positionsCompressed:F.geometryPositions,normalsCompressed:F.geometryNormals,colorsCompressed:F.geometryColors,indices:F.geometryIndices,edgeIndices:F.geometryEdgeIndices,positionsDecodeMatrix:g}),N[D]=!0),i.createMesh(b.apply(U,{id:I,geometryId:D,origin:j,matrix:x,color:a,metallic:A,roughness:C,opacity:h})),B.push(I);}else {let e,t,s,o,f,m,g=!1;switch(_[r]){case 0:e="solid",t=l.subarray(y[r],n?l.length:y[r+1]),s=u.subarray(v[r],n?u.length:v[r+1]),f=p.subarray(P[r],n?p.length:P[r+1]),m=d.subarray(T[r],n?d.length:T[r+1]),g=t.length>0&&f.length>0;break;case 1:e="surface",t=l.subarray(y[r],n?l.length:y[r+1]),s=u.subarray(v[r],n?u.length:v[r+1]),f=p.subarray(P[r],n?p.length:P[r+1]),m=d.subarray(T[r],n?d.length:T[r+1]),g=t.length>0&&f.length>0;break;case 2:e="points",t=l.subarray(y[r],n?l.length:y[r+1]),o=Gg(c.subarray(w[r],n?c.length:w[r+1])),g=t.length>0;break;case 3:e="lines",t=l.subarray(y[r],n?l.length:y[r+1]),f=p.subarray(P[r],n?p.length:P[r+1]),g=t.length>0&&f.length>0;break;default:continue}g&&(i.createMesh(b.apply(U,{id:I,origin:j,primitive:e,positionsCompressed:t,normalsCompressed:s,colorsCompressed:o,indices:f,edgeIndices:m,positionsDecodeMatrix:S,color:a,metallic:A,roughness:C,opacity:h})),B.push(I));}}B.length>0&&i.createEntity(b.apply(V,{id:a,isObject:!0,meshIds:B}));}}}(e,t,o,i);}},Vg=f.vec4(),Ug=f.vec4();const zg=function(){const e=new Float32Array(3);return function(t){return e[0]=t[0]/255,e[1]=t[1]/255,e[2]=t[2]/255,e}}();const Wg={version:9,parse:function(e,t,s,i){const r=function(e){return {metadata:e[0],positions:e[1],normals:e[2],colors:e[3],indices:e[4],edgeIndices:e[5],matrices:e[6],reusedGeometriesDecodeMatrix:e[7],eachGeometryPrimitiveType:e[8],eachGeometryPositionsPortion:e[9],eachGeometryNormalsPortion:e[10],eachGeometryColorsPortion:e[11],eachGeometryIndicesPortion:e[12],eachGeometryEdgeIndicesPortion:e[13],eachMeshGeometriesPortion:e[14],eachMeshMatricesPortion:e[15],eachMeshMaterial:e[16],eachEntityId:e[17],eachEntityMeshesPortion:e[18],eachTileAABB:e[19],eachTileEntitiesPortion:e[20]}}(s),o=function(e){function t(e,t){return 0===e.length?[]:hg(e,t).buffer}return {metadata:JSON.parse(hg(e.metadata,{to:"string"})),positions:new Uint16Array(t(e.positions)),normals:new Int8Array(t(e.normals)),colors:new Uint8Array(t(e.colors)),indices:new Uint32Array(t(e.indices)),edgeIndices:new Uint32Array(t(e.edgeIndices)),matrices:new Float32Array(t(e.matrices)),reusedGeometriesDecodeMatrix:new Float32Array(t(e.reusedGeometriesDecodeMatrix)),eachGeometryPrimitiveType:new Uint8Array(t(e.eachGeometryPrimitiveType)),eachGeometryPositionsPortion:new Uint32Array(t(e.eachGeometryPositionsPortion)),eachGeometryNormalsPortion:new Uint32Array(t(e.eachGeometryNormalsPortion)),eachGeometryColorsPortion:new Uint32Array(t(e.eachGeometryColorsPortion)),eachGeometryIndicesPortion:new Uint32Array(t(e.eachGeometryIndicesPortion)),eachGeometryEdgeIndicesPortion:new Uint32Array(t(e.eachGeometryEdgeIndicesPortion)),eachMeshGeometriesPortion:new Uint32Array(t(e.eachMeshGeometriesPortion)),eachMeshMatricesPortion:new Uint32Array(t(e.eachMeshMatricesPortion)),eachMeshMaterial:new Uint8Array(t(e.eachMeshMaterial)),eachEntityId:JSON.parse(hg(e.eachEntityId,{to:"string"})),eachEntityMeshesPortion:new Uint32Array(t(e.eachEntityMeshesPortion)),eachTileAABB:new Float64Array(t(e.eachTileAABB)),eachTileEntitiesPortion:new Uint32Array(t(e.eachTileEntitiesPortion))}}(r);!function(e,t,s,i){const r=s.metadata,o=s.positions,n=s.normals,a=s.colors,h=s.indices,l=s.edgeIndices,u=s.matrices,c=s.reusedGeometriesDecodeMatrix,p=s.eachGeometryPrimitiveType,d=s.eachGeometryPositionsPortion,m=s.eachGeometryNormalsPortion,g=s.eachGeometryColorsPortion,_=s.eachGeometryIndicesPortion,y=s.eachGeometryEdgeIndicesPortion,v=s.eachMeshGeometriesPortion,w=s.eachMeshMatricesPortion,P=s.eachMeshMaterial,T=s.eachEntityId,x=s.eachEntityMeshesPortion,M=s.eachTileAABB,D=s.eachTileEntitiesPortion,A=d.length,C=v.length,I=x.length,F=D.length;let B=0;const E=i.id;e.metaScene.metaModels[E]||(e.metaScene.createMetaModel(E,r,{includeTypes:t.includeTypes,excludeTypes:t.excludeTypes,globalizeObjectIds:t.globalizeObjectIds}),i.once("destroyed",(()=>{e.metaScene.destroyMetaModel(E);})));const S=new Uint32Array(A);for(let e=0;e<C;e++){const t=v[e];void 0!==S[t]?S[t]++:S[t]=1;}const R=f.vec3(),O=f.AABB3(),L={};for(let s=0;s<F;s++){const r=s===F-1,C=D[s],E=r?I-1:D[s+1]-1,N=6*s,k=M.subarray(N,N+6);f.getAABB3Center(k,R),O[0]=k[0]-R[0],O[1]=k[1]-R[1],O[2]=k[2]-R[2],O[3]=k[3]-R[0],O[4]=k[4]-R[1],O[5]=k[5]-R[2];const j=Pt.createPositionsDecodeMatrix(O),G={};for(let r=C;r<=E;r++){const M=T[r],D=t.globalizeObjectIds?f.globalizeObjectId(i.id,M):M,C=r===I-1,F=x[r],E=C?v.length-1:x[r+1]-1,N=[],k=e.metaScene.metaObjects[D],H={},V={};if(k){if(t.excludeTypesMap&&k.type&&t.excludeTypesMap[k.type])continue;if(t.includeTypesMap&&k.type&&!t.includeTypesMap[k.type])continue;const e=t.objectDefaults?t.objectDefaults[k.type]||t.objectDefaults.DEFAULT:null;e&&(!1===e.visible&&(H.visible=!1),!1===e.pickable&&(H.pickable=!1),e.colorize&&(V.color=e.colorize),void 0!==e.opacity&&null!==e.opacity&&(V.opacity=e.opacity),void 0!==e.metallic&&null!==e.metallic&&(V.metallic=e.metallic),void 0!==e.roughness&&null!==e.roughness&&(V.roughness=e.roughness));}else if(t.excludeUnclassifiedObjects)continue;for(let e=F;e<=E;e++){const r=v[e],T=S[r]>1,x=r===A-1,M=zg(P.subarray(6*e,6*e+3)),D=P[6*e+3]/255,C=P[6*e+4]/255,I=P[6*e+5]/255,F=B++;if(T){const v=w[e],P=u.slice(v,v+16),T="geometry."+s+"."+r;let A=L[T];if(!A){A={batchThisMesh:!t.reuseGeometries};let e=!1;switch(p[r]){case 0:A.primitiveName="solid",A.geometryPositions=o.subarray(d[r],x?o.length:d[r+1]),A.geometryNormals=n.subarray(m[r],x?n.length:m[r+1]),A.geometryIndices=h.subarray(_[r],x?h.length:_[r+1]),A.geometryEdgeIndices=l.subarray(y[r],x?l.length:y[r+1]),e=A.geometryPositions.length>0&&A.geometryIndices.length>0;break;case 1:A.primitiveName="surface",A.geometryPositions=o.subarray(d[r],x?o.length:d[r+1]),A.geometryNormals=n.subarray(m[r],x?n.length:m[r+1]),A.geometryIndices=h.subarray(_[r],x?h.length:_[r+1]),A.geometryEdgeIndices=l.subarray(y[r],x?l.length:y[r+1]),e=A.geometryPositions.length>0&&A.geometryIndices.length>0;break;case 2:A.primitiveName="points",A.geometryPositions=o.subarray(d[r],x?o.length:d[r+1]),A.geometryColors=a.subarray(g[r],x?a.length:g[r+1]),e=A.geometryPositions.length>0;break;case 3:A.primitiveName="lines",A.geometryPositions=o.subarray(d[r],x?o.length:d[r+1]),A.geometryIndices=h.subarray(_[r],x?h.length:_[r+1]),e=A.geometryPositions.length>0&&A.geometryIndices.length>0;break;default:continue}if(e||(A=null),A&&(A.geometryPositions.length,A.batchThisMesh)){A.decompressedPositions=new Float32Array(A.geometryPositions.length),A.transformedAndRecompressedPositions=new Uint16Array(A.geometryPositions.length);const e=A.geometryPositions,t=A.decompressedPositions;for(let s=0,i=e.length;s<i;s+=3)t[s+0]=e[s+0]*c[0]+c[12],t[s+1]=e[s+1]*c[5]+c[13],t[s+2]=e[s+2]*c[10]+c[14];A.geometryPositions=null,L[T]=A;}}if(A)if(A.batchThisMesh){const e=A.decompressedPositions,t=A.transformedAndRecompressedPositions;for(let s=0,i=e.length;s<i;s+=3)Vg[0]=e[s+0],Vg[1]=e[s+1],Vg[2]=e[s+2],Vg[3]=1,f.transformVec4(P,Vg,Ug),Pt.compressPosition(Ug,O,Vg),t[s+0]=Vg[0],t[s+1]=Vg[1],t[s+2]=Vg[2];i.createMesh(b.apply(V,{id:F,origin:R,primitive:A.primitiveName,positionsCompressed:t,normalsCompressed:A.geometryNormals,colorsCompressed:A.geometryColors,indices:A.geometryIndices,edgeIndices:A.geometryEdgeIndices,positionsDecodeMatrix:j,color:M,metallic:C,roughness:I,opacity:D})),N.push(F);}else G[T]||(i.createGeometry({id:T,primitive:A.primitiveName,positionsCompressed:A.geometryPositions,normalsCompressed:A.geometryNormals,colorsCompressed:A.geometryColors,indices:A.geometryIndices,edgeIndices:A.geometryEdgeIndices,positionsDecodeMatrix:c}),G[T]=!0),i.createMesh(b.apply(V,{id:F,geometryId:T,origin:R,matrix:P,color:M,metallic:C,roughness:I,opacity:D})),N.push(F);}else {let e,t,s,u,c,f,v=!1;switch(p[r]){case 0:e="solid",t=o.subarray(d[r],x?o.length:d[r+1]),s=n.subarray(m[r],x?n.length:m[r+1]),c=h.subarray(_[r],x?h.length:_[r+1]),f=l.subarray(y[r],x?l.length:y[r+1]),v=t.length>0&&c.length>0;break;case 1:e="surface",t=o.subarray(d[r],x?o.length:d[r+1]),s=n.subarray(m[r],x?n.length:m[r+1]),c=h.subarray(_[r],x?h.length:_[r+1]),f=l.subarray(y[r],x?l.length:y[r+1]),v=t.length>0&&c.length>0;break;case 2:e="points",t=o.subarray(d[r],x?o.length:d[r+1]),u=a.subarray(g[r],x?a.length:g[r+1]),v=t.length>0;break;case 3:e="lines",t=o.subarray(d[r],x?o.length:d[r+1]),c=h.subarray(_[r],x?h.length:_[r+1]),v=t.length>0&&c.length>0;break;default:continue}v&&(i.createMesh(b.apply(V,{id:F,origin:R,primitive:e,positionsCompressed:t,normalsCompressed:s,colorsCompressed:u,indices:c,edgeIndices:f,positionsDecodeMatrix:j,color:M,metallic:C,roughness:I,opacity:D})),N.push(F));}}N.length>0&&i.createEntity(b.apply(H,{id:D,isObject:!0,meshIds:N}));}}}(e,t,o,i);}};console.log({pakoInflate:hg});const Xg=f.vec4(),Yg=f.vec4();const Kg=function(){const e=new Float32Array(3);return function(t){return e[0]=t[0]/255,e[1]=t[1]/255,e[2]=t[2]/255,e}}();!function(){const e=document.createElement("canvas"),t=e.getContext("2d");}();const Jg={version:10,parse:function(e,t,s,i){const r=function(e){return {metadata:e[0],textureData:e[1],eachTextureDataPortion:e[2],eachTextureDimensions:e[3],positions:e[4],normals:e[5],colors:e[6],uvs:e[7],indices:e[8],edgeIndices:e[9],eachTextureSetTextures:e[10],matrices:e[11],reusedGeometriesDecodeMatrix:e[12],eachGeometryPrimitiveType:e[13],eachGeometryPositionsPortion:e[14],eachGeometryNormalsPortion:e[15],eachGeometryColorsPortion:e[16],eachGeometryUVsPortion:e[17],eachGeometryIndicesPortion:e[18],eachGeometryEdgeIndicesPortion:e[19],eachMeshGeometriesPortion:e[20],eachMeshMatricesPortion:e[21],eachMeshTextureSet:e[22],eachMeshMaterialAttributes:e[23],eachEntityId:e[24],eachEntityMeshesPortion:e[25],eachTileAABB:e[26],eachTileEntitiesPortion:e[27]}}(s),o=function(e){function t(e,t){return 0===e.length?[]:hg(e,t).buffer}return {metadata:JSON.parse(hg(e.metadata,{to:"string"})),textureData:new Uint8Array(t(e.textureData)),eachTextureDataPortion:new Uint32Array(t(e.eachTextureDataPortion)),eachTextureDimensions:new Uint16Array(t(e.eachTextureDimensions)),positions:new Uint16Array(t(e.positions)),normals:new Int8Array(t(e.normals)),colors:new Uint8Array(t(e.colors)),uvs:new Float32Array(t(e.uvs)),indices:new Uint32Array(t(e.indices)),edgeIndices:new Uint32Array(t(e.edgeIndices)),eachTextureSetTextures:new Int32Array(t(e.eachTextureSetTextures)),matrices:new Float32Array(t(e.matrices)),reusedGeometriesDecodeMatrix:new Float32Array(t(e.reusedGeometriesDecodeMatrix)),eachGeometryPrimitiveType:new Uint8Array(t(e.eachGeometryPrimitiveType)),eachGeometryPositionsPortion:new Uint32Array(t(e.eachGeometryPositionsPortion)),eachGeometryNormalsPortion:new Uint32Array(t(e.eachGeometryNormalsPortion)),eachGeometryColorsPortion:new Uint32Array(t(e.eachGeometryColorsPortion)),eachGeometryUVsPortion:new Uint32Array(t(e.eachGeometryUVsPortion)),eachGeometryIndicesPortion:new Uint32Array(t(e.eachGeometryIndicesPortion)),eachGeometryEdgeIndicesPortion:new Uint32Array(t(e.eachGeometryEdgeIndicesPortion)),eachMeshGeometriesPortion:new Uint32Array(t(e.eachMeshGeometriesPortion)),eachMeshMatricesPortion:new Uint32Array(t(e.eachMeshMatricesPortion)),eachMeshTextureSet:new Int32Array(t(e.eachMeshTextureSet)),eachMeshMaterialAttributes:new Uint8Array(t(e.eachMeshMaterialAttributes)),eachEntityId:JSON.parse(hg(e.eachEntityId,{to:"string"})),eachEntityMeshesPortion:new Uint32Array(t(e.eachEntityMeshesPortion)),eachTileAABB:new Float64Array(t(e.eachTileAABB)),eachTileEntitiesPortion:new Uint32Array(t(e.eachTileEntitiesPortion))}}(r);!function(e,t,s,i){const r=s.metadata,o=s.textureData,n=s.eachTextureDataPortion;s.eachTextureDimensions;const a=s.positions,h=s.normals,l=s.colors,u=s.uvs,c=s.indices,p=s.edgeIndices,d=s.eachTextureSetTextures,m=s.matrices,g=s.reusedGeometriesDecodeMatrix,_=s.eachGeometryPrimitiveType,y=s.eachGeometryPositionsPortion,v=s.eachGeometryNormalsPortion,w=s.eachGeometryColorsPortion,P=s.eachGeometryUVsPortion,T=s.eachGeometryIndicesPortion,x=s.eachGeometryEdgeIndicesPortion,M=s.eachMeshGeometriesPortion,D=s.eachMeshMatricesPortion,A=s.eachMeshTextureSet,C=s.eachMeshMaterialAttributes,I=s.eachEntityId,F=s.eachEntityMeshesPortion,B=s.eachTileAABB,E=s.eachTileEntitiesPortion,S=n.length,R=d.length/5,O=y.length,L=M.length,N=F.length,k=E.length;let j=0;const G=i.id;e.metaScene.metaModels[G]||(e.metaScene.createMetaModel(G,r,{includeTypes:t.includeTypes,excludeTypes:t.excludeTypes,globalizeObjectIds:t.globalizeObjectIds}),i.once("destroyed",(()=>{e.metaScene.destroyMetaModel(G);})));for(let e=0;e<S;e++){const t=e===S-1,s=n[e],r=t?o.length:n[e+1];if(r-s>0){const t=new Uint8Array(o.subarray(s,r)).buffer;i.createTexture({id:`texture-${e}`,buffers:[t]});}}for(let e=0;e<R;e++){const t=5*e,s=`textureSet-${e}`,r=d[t+0],o=d[t+1],n=d[t+2],a=d[t+3],h=d[t+4];i.createTextureSet({id:s,colorTextureId:r>=0?`texture-${r}`:null,normalsTextureId:n>=0?`texture-${n}`:null,metallicRoughnessTextureId:o>=0?`texture-${o}`:null,emissiveTextureId:a>=0?`texture-${a}`:null,occlusionTextureId:h>=0?`texture-${h}`:null});}const H=new Uint32Array(O);for(let e=0;e<L;e++){const t=M[e];void 0!==H[t]?H[t]++:H[t]=1;}const V=f.vec3(),U=f.AABB3(),z={};for(let s=0;s<k;s++){const r=s===k-1,o=E[s],n=r?N-1:E[s+1]-1,d=6*s,S=B.subarray(d,d+6);f.getAABB3Center(S,V),U[0]=S[0]-V[0],U[1]=S[1]-V[1],U[2]=S[2]-V[2],U[3]=S[3]-V[0],U[4]=S[4]-V[1],U[5]=S[5]-V[2];const R=Pt.createPositionsDecodeMatrix(U),L={};for(let r=o;r<=n;r++){const o=I[r],n=t.globalizeObjectIds?f.globalizeObjectId(i.id,o):o,d=r===N-1,B=F[r],E=d?M.length-1:F[r+1]-1,S=[],k=e.metaScene.metaObjects[n],G={},W={};if(k){if(t.excludeTypesMap&&k.type&&t.excludeTypesMap[k.type])continue;if(t.includeTypesMap&&k.type&&!t.includeTypesMap[k.type])continue;const e=t.objectDefaults?t.objectDefaults[k.type]||t.objectDefaults.DEFAULT:null;e&&(!1===e.visible&&(G.visible=!1),!1===e.pickable&&(G.pickable=!1),e.colorize&&(W.color=e.colorize),void 0!==e.opacity&&null!==e.opacity&&(W.opacity=e.opacity),void 0!==e.metallic&&null!==e.metallic&&(W.metallic=e.metallic),void 0!==e.roughness&&null!==e.roughness&&(W.roughness=e.roughness));}else if(t.excludeUnclassifiedObjects)continue;for(let e=B;e<=E;e++){const r=M[e],o=H[r]>1,n=r===O-1,d=A[e],I=d>=0?`textureSet-${d}`:null,F=Kg(C.subarray(6*e,6*e+3)),B=C[6*e+3]/255,E=C[6*e+4]/255,N=C[6*e+5]/255,k=j++;if(o){const o=D[e],d=m.slice(o,o+16),M="geometry."+s+"."+r;let A=z[M];if(!A){A={batchThisMesh:!t.reuseGeometries};let e=!1;switch(_[r]){case 0:A.primitiveName="solid",A.geometryPositions=a.subarray(y[r],n?a.length:y[r+1]),A.geometryNormals=h.subarray(v[r],n?h.length:v[r+1]),A.geometryUVs=u.subarray(P[r],n?u.length:P[r+1]),A.geometryIndices=c.subarray(T[r],n?c.length:T[r+1]),A.geometryEdgeIndices=p.subarray(x[r],n?p.length:x[r+1]),e=A.geometryPositions.length>0&&A.geometryIndices.length>0;break;case 1:A.primitiveName="surface",A.geometryPositions=a.subarray(y[r],n?a.length:y[r+1]),A.geometryNormals=h.subarray(v[r],n?h.length:v[r+1]),A.geometryUVs=u.subarray(P[r],n?u.length:P[r+1]),A.geometryIndices=c.subarray(T[r],n?c.length:T[r+1]),A.geometryEdgeIndices=p.subarray(x[r],n?p.length:x[r+1]),e=A.geometryPositions.length>0&&A.geometryIndices.length>0;break;case 2:A.primitiveName="points",A.geometryPositions=a.subarray(y[r],n?a.length:y[r+1]),A.geometryColors=l.subarray(w[r],n?l.length:w[r+1]),e=A.geometryPositions.length>0;break;case 3:A.primitiveName="lines",A.geometryPositions=a.subarray(y[r],n?a.length:y[r+1]),A.geometryIndices=c.subarray(T[r],n?c.length:T[r+1]),e=A.geometryPositions.length>0&&A.geometryIndices.length>0;break;default:continue}if(e||(A=null),A&&(A.geometryPositions.length,A.batchThisMesh)){A.decompressedPositions=new Float32Array(A.geometryPositions.length),A.transformedAndRecompressedPositions=new Uint16Array(A.geometryPositions.length);const e=A.geometryPositions,t=A.decompressedPositions;for(let s=0,i=e.length;s<i;s+=3)t[s+0]=e[s+0]*g[0]+g[12],t[s+1]=e[s+1]*g[5]+g[13],t[s+2]=e[s+2]*g[10]+g[14];A.geometryPositions=null,z[M]=A;}}if(A)if(A.batchThisMesh){const e=A.decompressedPositions,t=A.transformedAndRecompressedPositions;for(let s=0,i=e.length;s<i;s+=3)Xg[0]=e[s+0],Xg[1]=e[s+1],Xg[2]=e[s+2],Xg[3]=1,f.transformVec4(d,Xg,Yg),Pt.compressPosition(Yg,U,Xg),t[s+0]=Xg[0],t[s+1]=Xg[1],t[s+2]=Xg[2];i.createMesh(b.apply(W,{id:k,textureSetId:I,origin:V,primitive:A.primitiveName,positionsCompressed:t,normalsCompressed:A.geometryNormals,uv:A.geometryUVs,colorsCompressed:A.geometryColors,indices:A.geometryIndices,edgeIndices:A.geometryEdgeIndices,positionsDecodeMatrix:R,color:F,metallic:E,roughness:N,opacity:B})),S.push(k);}else L[M]||(i.createGeometry({id:M,primitive:A.primitiveName,positionsCompressed:A.geometryPositions,normalsCompressed:A.geometryNormals,uv:A.geometryUVs,colorsCompressed:A.geometryColors,indices:A.geometryIndices,edgeIndices:A.geometryEdgeIndices,positionsDecodeMatrix:g}),L[M]=!0),i.createMesh(b.apply(W,{id:k,geometryId:M,textureSetId:I,matrix:d,color:F,metallic:E,roughness:N,opacity:B,origin:V})),S.push(k);}else {let e,t,s,o,d,f,m,g=!1;switch(_[r]){case 0:e="solid",t=a.subarray(y[r],n?a.length:y[r+1]),s=h.subarray(v[r],n?h.length:v[r+1]),o=u.subarray(P[r],n?u.length:P[r+1]),f=c.subarray(T[r],n?c.length:T[r+1]),m=p.subarray(x[r],n?p.length:x[r+1]),g=t.length>0&&f.length>0;break;case 1:e="surface",t=a.subarray(y[r],n?a.length:y[r+1]),s=h.subarray(v[r],n?h.length:v[r+1]),o=u.subarray(P[r],n?u.length:P[r+1]),f=c.subarray(T[r],n?c.length:T[r+1]),m=p.subarray(x[r],n?p.length:x[r+1]),g=t.length>0&&f.length>0;break;case 2:e="points",t=a.subarray(y[r],n?a.length:y[r+1]),d=l.subarray(w[r],n?l.length:w[r+1]),g=t.length>0;break;case 3:e="lines",t=a.subarray(y[r],n?a.length:y[r+1]),f=c.subarray(T[r],n?c.length:T[r+1]),g=t.length>0&&f.length>0;break;default:continue}g&&(i.createMesh(b.apply(W,{id:k,textureSetId:I,origin:V,primitive:e,positionsCompressed:t,normalsCompressed:s,uv:o&&o.length>0?o:null,colorsCompressed:d,indices:f,edgeIndices:m,positionsDecodeMatrix:R,color:F,metallic:E,roughness:N,opacity:B})),S.push(k));}}S.length>0&&i.createEntity(b.apply(G,{id:n,isObject:!0,meshIds:S}));}}}(e,t,o,i);}},Zg={};Zg[gg.version]=gg,Zg[vg.version]=vg,Zg[Pg.version]=Pg,Zg[Mg.version]=Mg,Zg[Cg.version]=Cg,Zg[Bg.version]=Bg,Zg[Og.version]=Og,Zg[Hg.version]=Hg,Zg[Wg.version]=Wg,Zg[Jg.version]=Jg;class Qg extends h{constructor(e,t={}){super("XKTLoader",e,t),this._maxGeometryBatchSize=t.maxGeometryBatchSize,this.textureTranscoder=t.textureTranscoder,this.dataSource=t.dataSource,this.objectDefaults=t.objectDefaults,this.includeTypes=t.includeTypes,this.excludeTypes=t.excludeTypes,this.excludeUnclassifiedObjects=t.excludeUnclassifiedObjects,this.reuseGeometries=t.reuseGeometries;}get supportedVersions(){return Object.keys(Zg)}get textureTranscoder(){return this._textureTranscoder}set textureTranscoder(e){this._textureTranscoder=e;}get dataSource(){return this._dataSource}set dataSource(e){this._dataSource=e||new im;}get objectDefaults(){return this._objectDefaults}set objectDefaults(e){this._objectDefaults=e||$d;}get includeTypes(){return this._includeTypes}set includeTypes(e){this._includeTypes=e;}get excludeTypes(){return this._excludeTypes}set excludeTypes(e){this._excludeTypes=e;}get excludeUnclassifiedObjects(){return this._excludeUnclassifiedObjects}set excludeUnclassifiedObjects(e){this._excludeUnclassifiedObjects=!!e;}get globalizeObjectIds(){return this._globalizeObjectIds}set globalizeObjectIds(e){this._globalizeObjectIds=!!e;}get reuseGeometries(){return this._reuseGeometries}set reuseGeometries(e){this._reuseGeometries=!1!==e;}load(e={}){e.id&&this.viewer.scene.components[e.id]&&(this.error("Component with this ID already exists in viewer: "+e.id+" - will autogenerate this ID"),delete e.id);const t=new wh(this.viewer.scene,b.apply(e,{isModel:!0,textureTranscoder:this._textureTranscoder,maxGeometryBatchSize:this._maxGeometryBatchSize,origin:e.origin})),s=t.id;if(!e.src&&!e.xkt)return this.error("load() param expected: src or xkt"),t;const i={},r=e.includeTypes||this._includeTypes,o=e.excludeTypes||this._excludeTypes,n=e.objectDefaults||this._objectDefaults;if(i.reuseGeometries=null!==e.reuseGeometries&&void 0!==e.reuseGeometries?e.reuseGeometries:!1!==this._reuseGeometries,r){i.includeTypesMap={};for(let e=0,t=r.length;e<t;e++)i.includeTypesMap[r[e]]=!0;}if(o){i.excludeTypesMap={};for(let e=0,t=o.length;e<t;e++)i.excludeTypesMap[o[e]]=!0;}if(n&&(i.objectDefaults=n),i.excludeUnclassifiedObjects=void 0!==e.excludeUnclassifiedObjects?!!e.excludeUnclassifiedObjects:this._excludeUnclassifiedObjects,i.globalizeObjectIds=void 0!==e.globalizeObjectIds?!!e.globalizeObjectIds:this._globalizeObjectIds,e.metaModelSrc||e.metaModelData){const n=n=>!!this.viewer.metaScene.createMetaModel(s,n,{includeTypes:r,excludeTypes:o,globalizeObjectIds:this.globalizeObjectIds})&&(e.src?this._loadModel(e.src,e,i,t):this._parseModel(e.xkt,e,i,t),t.once("destroyed",(()=>{this.viewer.metaScene.destroyMetaModel(t.id);})),!0);if(e.metaModelSrc){const i=e.metaModelSrc;this.viewer.scene.canvas.spinner.processes++,this._dataSource.getMetaModel(i,(e=>{t.destroyed||(n(e)||(this.error(`load(): Failed to load model metadata for model '${s} from '${i}' - metadata not valid`),t.fire("error","Metadata not valid")),this.viewer.scene.canvas.spinner.processes--);}),(e=>{this.error(`load(): Failed to load model metadata for model '${s} from  '${i}' - ${e}`),t.fire("error",`Failed to load model metadata from  '${i}' - ${e}`),this.viewer.scene.canvas.spinner.processes--;}));}else e.metaModelData&&(n(e.metaModelData)||(this.error(`load(): Failed to load model metadata for model '${s} from '${e.metaModelSrc}' - metadata not valid`),t.fire("error","Metadata not valid")));}else e.src?this._loadModel(e.src,e,i,t):this._parseModel(e.xkt,e,i,t);return t}_loadModel(e,t,s,i){const r=this.viewer.scene.canvas.spinner;r.processes++,this._dataSource.getXKT(t.src,(e=>{this._parseModel(e,t,s,i),r.processes--;}),(e=>{r.processes--,this.error(e),i.fire("error",e);}));}_parseModel(e,t,s,i){if(i.destroyed)return;const r=new DataView(e),o=new Uint8Array(e),n=r.getUint32(0,!0),a=Zg[n];if(!a)return void this.error("Unsupported .XKT file version: "+n+" - this XKTLoaderPlugin supports versions "+Object.keys(Zg));this.log("Loading .xkt V"+n);const h=r.getUint32(4,!0),l=[];let u=4*(h+2);for(let e=0;e<h;e++){const t=r.getUint32(4*(e+2),!0);l.push(o.subarray(u,u+t)),u+=t;}a.parse(this.viewer,s,l,i),i.finalize(),this._createDefaultMetaModelIfNeeded(i,t,s),i.scene.once("tick",(()=>{i.destroyed||(i.scene.fire("modelLoaded",i.id),i.fire("loaded",!0,!1));}));}_createDefaultMetaModelIfNeeded(e,t,s){const i=e.id;if(!this.viewer.metaScene.metaModels[i]){const r={metaObjects:[]};r.metaObjects.push({id:i,type:"default",name:i,parent:null});const o=e.entityList;for(let e=0,t=o.length;e<t;e++){const t=o[e];t.isObject&&r.metaObjects.push({id:t.id,type:"default",name:t.id,parent:i});}const n=t.src;this.viewer.metaScene.createMetaModel(i,r,{includeTypes:s.includeTypes,excludeTypes:s.excludeTypes,globalizeObjectIds:s.globalizeObjectIds,getProperties:async e=>await this._dataSource.getProperties(n,e)}),e.once("destroyed",(()=>{this.viewer.metaScene.destroyMetaModel(i);}));}}}var $g={};!function(e){var t,s="File format is not recognized.",i="Error while reading zip file.",r="Error while reading file data.",o=524288,n="text/plain";try{t=0===new Blob([new DataView(new ArrayBuffer(0))]).size;}catch(e){}function a(){this.crc=-1;}function h(){}function l(e,t){var s,i;return s=new ArrayBuffer(e),i=new Uint8Array(s),t&&i.set(t,0),{buffer:s,array:i,view:new DataView(s)}}function u(){}function c(e){var t,s=this;s.size=0,s.init=function(i,r){var o=new Blob([e],{type:n});(t=new d(o)).init((function(){s.size=t.size,i();}),r);},s.readUint8Array=function(e,s,i,r){t.readUint8Array(e,s,i,r);};}function p(t){var s,i=this;i.size=0,i.init=function(e){for(var r=t.length;"="==t.charAt(r-1);)r--;s=t.indexOf(",")+1,i.size=Math.floor(.75*(r-s)),e();},i.readUint8Array=function(i,r,o){var n,a=l(r),h=4*Math.floor(i/3),u=4*Math.ceil((i+r)/3),c=e.atob(t.substring(h+s,u+s)),p=i-3*Math.floor(h/4);for(n=p;n<p+r;n++)a.array[n-p]=c.charCodeAt(n);o(a.array);};}function d(e){var t=this;t.size=0,t.init=function(s){t.size=e.size,s();},t.readUint8Array=function(t,s,i,r){var o=new FileReader;o.onload=function(e){i(new Uint8Array(e.target.result));},o.onerror=r;try{o.readAsArrayBuffer(function(e,t,s){if(t<0||s<0||t+s>e.size)throw new RangeError("offset:"+t+", length:"+s+", size:"+e.size);return e.slice?e.slice(t,t+s):e.webkitSlice?e.webkitSlice(t,t+s):e.mozSlice?e.mozSlice(t,t+s):e.msSlice?e.msSlice(t,t+s):void 0}(e,t,s));}catch(e){r(e);}};}function f(){}function m(e){var s,i=this;i.init=function(e){s=new Blob([],{type:n}),e();},i.writeUint8Array=function(e,i){s=new Blob([s,t?e:e.buffer],{type:n}),i();},i.getData=function(t,i){var r=new FileReader;r.onload=function(e){t(e.target.result);},r.onerror=i,r.readAsText(s,e);};}function g(t){var s=this,i="",r="";s.init=function(e){i+="data:"+(t||"")+";base64,",e();},s.writeUint8Array=function(t,s){var o,n=r.length,a=r;for(r="",o=0;o<3*Math.floor((n+t.length)/3)-n;o++)a+=String.fromCharCode(t[o]);for(;o<t.length;o++)r+=String.fromCharCode(t[o]);a.length>2?i+=e.btoa(a):r=a,s();},s.getData=function(t){t(i+e.btoa(r));};}function _(e){var s,i=this;i.init=function(t){s=new Blob([],{type:e}),t();},i.writeUint8Array=function(i,r){s=new Blob([s,t?i:i.buffer],{type:e}),r();},i.getData=function(e){e(s);};}function y(e,t,s,i,r,n,a,h,l,u){var c,p,d,f=0,m=t.sn;function g(){e.removeEventListener("message",_,!1),h(p,d);}function _(t){var s=t.data,r=s.data,o=s.error;if(o)return o.toString=function(){return "Error: "+this.message},void l(o);if(s.sn===m)switch("number"==typeof s.codecTime&&(e.codecTime+=s.codecTime),"number"==typeof s.crcTime&&(e.crcTime+=s.crcTime),s.type){case"append":r?(p+=r.length,i.writeUint8Array(r,(function(){y();}),u)):y();break;case"flush":d=s.crc,r?(p+=r.length,i.writeUint8Array(r,(function(){g();}),u)):g();break;case"progress":a&&a(c+s.loaded,n);break;case"importScripts":case"newTask":case"echo":break;default:console.warn("zip.js:launchWorkerProcess: unknown message: ",s);}}function y(){(c=f*o)<=n?s.readUint8Array(r+c,Math.min(o,n-c),(function(s){a&&a(c,n);var i=0===c?t:{sn:m};i.type="append",i.data=s;try{e.postMessage(i,[s.buffer]);}catch(t){e.postMessage(i);}f++;}),l):e.postMessage({sn:m,type:"flush"});}p=0,e.addEventListener("message",_,!1),y();}function v(e,t,s,i,r,n,h,l,u,c){var p,d=0,f=0,m="input"===n,g="output"===n,_=new a;!function n(){var a;if((p=d*o)<r)t.readUint8Array(i+p,Math.min(o,r-p),(function(t){var i;try{i=e.append(t,(function(e){h&&h(p+e,r);}));}catch(e){return void u(e)}i?(f+=i.length,s.writeUint8Array(i,(function(){d++,setTimeout(n,1);}),c),g&&_.append(i)):(d++,setTimeout(n,1)),m&&_.append(t),h&&h(p,r);}),u);else {try{a=e.flush();}catch(e){return void u(e)}a?(g&&_.append(a),f+=a.length,s.writeUint8Array(a,(function(){l(f,_.get());}),c)):l(f,_.get());}}();}function b(t,s,i,r,o,n,a,l,u,c,p){var d="input";e.zip.useWebWorkers&&a?y(t,{sn:s,codecClass:"NOOP",crcType:d},i,r,o,n,u,l,c,p):v(new h,i,r,o,n,d,u,l,c,p);}function w(e){var t,s,i="",r=["Ç","ü","é","â","ä","à","å","ç","ê","ë","è","ï","î","ì","Ä","Å","É","æ","Æ","ô","ö","ò","û","ù","ÿ","Ö","Ü","ø","£","Ø","×","ƒ","á","í","ó","ú","ñ","Ñ","ª","º","¿","®","¬","½","¼","¡","«","»","_","_","_","¦","¦","Á","Â","À","©","¦","¦","+","+","¢","¥","+","+","-","-","+","-","+","ã","Ã","+","+","-","-","¦","-","+","¤","ð","Ð","Ê","Ë","È","i","Í","Î","Ï","+","+","_","_","¦","Ì","_","Ó","ß","Ô","Ò","õ","Õ","µ","þ","Þ","Ú","Û","Ù","ý","Ý","¯","´","­","±","_","¾","¶","§","÷","¸","°","¨","·","¹","³","²","_"," "];for(t=0;t<e.length;t++)i+=(s=255&e.charCodeAt(t))>127?r[s-128]:String.fromCharCode(s);return i}function P(e){return decodeURIComponent(escape(e))}function T(e){var t,s="";for(t=0;t<e.length;t++)s+=String.fromCharCode(e[t]);return s}function x(e,t,s,i,r){e.version=t.view.getUint16(s,!0),e.bitFlag=t.view.getUint16(s+2,!0),e.compressionMethod=t.view.getUint16(s+4,!0),e.lastModDateRaw=t.view.getUint32(s+6,!0),e.lastModDate=function(e){var t=(4294901760&e)>>16,s=65535&e;try{return new Date(1980+((65024&t)>>9),((480&t)>>5)-1,31&t,(63488&s)>>11,(2016&s)>>5,2*(31&s),0)}catch(e){}}(e.lastModDateRaw),1!=(1&e.bitFlag)?((i||8!=(8&e.bitFlag))&&(e.crc32=t.view.getUint32(s+10,!0),e.compressedSize=t.view.getUint32(s+14,!0),e.uncompressedSize=t.view.getUint32(s+18,!0)),4294967295!==e.compressedSize&&4294967295!==e.uncompressedSize?(e.filenameLength=t.view.getUint16(s+22,!0),e.extraFieldLength=t.view.getUint16(s+24,!0)):r("File is using Zip64 (4gb+ file size).")):r("File contains encrypted entry.");}function M(t,o,n){var a=0;function h(){}h.prototype.getData=function(i,o,h,u){var c=this;function p(e,t){u&&!function(e){var t=l(4);return t.view.setUint32(0,e),c.crc32==t.view.getUint32(0)}(t)?n("CRC failed."):i.getData((function(e){o(e);}));}function d(e){n(e||r);}function f(e){n(e||"Error while writing file data.");}t.readUint8Array(c.offset,30,(function(r){var o,m=l(r.length,r);1347093252==m.view.getUint32(0)?(x(c,m,4,!1,n),o=c.offset+30+c.filenameLength+c.extraFieldLength,i.init((function(){0===c.compressionMethod?b(c._worker,a++,t,i,o,c.compressedSize,u,p,h,d,f):function(t,s,i,r,o,n,a,h,l,u,c){var p=a?"output":"none";e.zip.useWebWorkers?y(t,{sn:s,codecClass:"Inflater",crcType:p},i,r,o,n,l,h,u,c):v(new e.zip.Inflater,i,r,o,n,p,l,h,u,c);}(c._worker,a++,t,i,o,c.compressedSize,u,p,h,d,f);}),f)):n(s);}),d);};var u={getEntries:function(e){var r=this._worker;!function(e){t.size<22?n(s):r(22,(function(){r(Math.min(65558,t.size),(function(){n(s);}));}));function r(s,r){t.readUint8Array(t.size-s,s,(function(t){for(var s=t.length-22;s>=0;s--)if(80===t[s]&&75===t[s+1]&&5===t[s+2]&&6===t[s+3])return void e(new DataView(t.buffer,s,22));r();}),(function(){n(i);}));}}((function(o){var a,u;a=o.getUint32(16,!0),u=o.getUint16(8,!0),a<0||a>=t.size?n(s):t.readUint8Array(a,t.size-a,(function(t){var i,o,a,c,p=0,d=[],f=l(t.length,t);for(i=0;i<u;i++){if((o=new h)._worker=r,1347092738!=f.view.getUint32(p))return void n(s);x(o,f,p+6,!0,n),o.commentLength=f.view.getUint16(p+32,!0),o.directory=16==(16&f.view.getUint8(p+38)),o.offset=f.view.getUint32(p+42,!0),a=T(f.array.subarray(p+46,p+46+o.filenameLength)),o.filename=2048==(2048&o.bitFlag)?P(a):w(a),o.directory||"/"!=o.filename.charAt(o.filename.length-1)||(o.directory=!0),c=T(f.array.subarray(p+46+o.filenameLength+o.extraFieldLength,p+46+o.filenameLength+o.extraFieldLength+o.commentLength)),o.comment=2048==(2048&o.bitFlag)?P(c):w(c),d.push(o),p+=46+o.filenameLength+o.extraFieldLength+o.commentLength;}e(d);}),(function(){n(i);}));}));},close:function(e){this._worker&&(this._worker.terminate(),this._worker=null),e&&e();},_worker:null};e.zip.useWebWorkers?F("inflater",(function(e){u._worker=e,o(u);}),(function(e){n(e);})):o(u);}function D(e){return unescape(encodeURIComponent(e))}function A(e){var t,s=[];for(t=0;t<e.length;t++)s.push(e.charCodeAt(t));return s}function C(t,s,i,o){var n={},a=[],h=0,u=0;function c(e){i(e||"Error while writing zip file.");}function p(e){i(e||r);}var d={add:function(s,r,d,f,m){var g,_,w,P=this._worker;function T(e,s){var i=l(16);h+=e||0,i.view.setUint32(0,1347094280),void 0!==s&&(g.view.setUint32(10,s,!0),i.view.setUint32(4,s,!0)),r&&(i.view.setUint32(8,e,!0),g.view.setUint32(14,e,!0),i.view.setUint32(12,r.size,!0),g.view.setUint32(18,r.size,!0)),t.writeUint8Array(i.array,(function(){h+=16,d();}),c);}function x(){m=m||{},s=s.trim(),m.directory&&"/"!=s.charAt(s.length-1)&&(s+="/"),n.hasOwnProperty(s)?i("File already exists."):(_=A(D(s)),a.push(s),function(e){var i;w=m.lastModDate||new Date,g=l(26),n[s]={headerArray:g.array,directory:m.directory,filename:_,offset:h,comment:A(D(m.comment||""))},g.view.setUint32(0,335546376),m.version&&g.view.setUint8(0,m.version),o||0===m.level||m.directory||g.view.setUint16(4,2048),g.view.setUint16(6,(w.getHours()<<6|w.getMinutes())<<5|w.getSeconds()/2,!0),g.view.setUint16(8,(w.getFullYear()-1980<<4|w.getMonth()+1)<<5|w.getDate(),!0),g.view.setUint16(22,_.length,!0),(i=l(30+_.length)).view.setUint32(0,1347093252),i.array.set(g.array,4),i.array.set(_,30),h+=i.array.length,t.writeUint8Array(i.array,e,c);}((function(){r?o||0===m.level?b(P,u++,r,t,0,r.size,!0,T,f,p,c):function(t,s,i,r,o,n,a,h,l){var u="input";e.zip.useWebWorkers?y(t,{sn:s,options:{level:o},codecClass:"Deflater",crcType:u},i,r,0,i.size,a,n,h,l):v(new e.zip.Deflater,i,r,0,i.size,u,a,n,h,l);}(P,u++,r,t,m.level,T,f,p,c):T();})));}r?r.init(x,p):x();},close:function(e){this._worker&&(this._worker.terminate(),this._worker=null);var s,i,r,o=0,u=0;for(i=0;i<a.length;i++)o+=46+(r=n[a[i]]).filename.length+r.comment.length;for(s=l(o+22),i=0;i<a.length;i++)r=n[a[i]],s.view.setUint32(u,1347092738),s.view.setUint16(u+4,5120),s.array.set(r.headerArray,u+6),s.view.setUint16(u+32,r.comment.length,!0),r.directory&&s.view.setUint8(u+38,16),s.view.setUint32(u+42,r.offset,!0),s.array.set(r.filename,u+46),s.array.set(r.comment,u+46+r.filename.length),u+=46+r.filename.length+r.comment.length;s.view.setUint32(u,1347093766),s.view.setUint16(u+8,a.length,!0),s.view.setUint16(u+10,a.length,!0),s.view.setUint32(u+12,o,!0),s.view.setUint32(u+16,h,!0),t.writeUint8Array(s.array,(function(){t.getData(e);}),c);},_worker:null};e.zip.useWebWorkers?F("deflater",(function(e){d._worker=e,s(d);}),(function(e){i(e);})):s(d);}a.prototype.append=function(e){for(var t=0|this.crc,s=this.table,i=0,r=0|e.length;i<r;i++)t=t>>>8^s[255&(t^e[i])];this.crc=t;},a.prototype.get=function(){return ~this.crc},a.prototype.table=function(){var e,t,s,i=[];for(e=0;e<256;e++){for(s=e,t=0;t<8;t++)1&s?s=s>>>1^3988292384:s>>>=1;i[e]=s;}return i}(),h.prototype.append=function(e,t){return e},h.prototype.flush=function(){},c.prototype=new u,c.prototype.constructor=c,p.prototype=new u,p.prototype.constructor=p,d.prototype=new u,d.prototype.constructor=d,f.prototype.getData=function(e){e(this.data);},m.prototype=new f,m.prototype.constructor=m,g.prototype=new f,g.prototype.constructor=g,_.prototype=new f,_.prototype.constructor=_;var I={deflater:["z-worker.js","deflate.js"],inflater:["z-worker.js","inflate.js"]};function F(t,s,i){if(null===e.zip.workerScripts||null===e.zip.workerScriptsPath){var r;if(e.zip.workerScripts){if(r=e.zip.workerScripts[t],!Array.isArray(r))return void i(new Error("zip.workerScripts."+t+" is not an array!"));r=function(e){var t=document.createElement("a");return e.map((function(e){return t.href=e,t.href}))}(r);}else (r=I[t].slice(0))[0]=(e.zip.workerScriptsPath||"")+r[0];var o=new Worker(r[0]);o.codecTime=o.crcTime=0,o.postMessage({type:"importScripts",scripts:r.slice(1)}),o.addEventListener("message",(function e(t){var r=t.data;if(r.error)return o.terminate(),void i(r.error);"importScripts"===r.type&&(o.removeEventListener("message",e),o.removeEventListener("error",n),s(o));})),o.addEventListener("error",n);}else i(new Error("Either zip.workerScripts or zip.workerScriptsPath may be set, not both."));function n(e){o.terminate(),i(e);}}function B(e){console.error(e);}e.zip={Reader:u,Writer:f,BlobReader:d,Data64URIReader:p,TextReader:c,BlobWriter:_,Data64URIWriter:g,TextWriter:m,createReader:function(e,t,s){s=s||B,e.init((function(){M(e,t,s);}),s);},createWriter:function(e,t,s,i){s=s||B,i=!!i,e.init((function(){C(e,t,s,i);}),s);},useWebWorkers:!0,workerScriptsPath:null,workerScripts:null};}($g);const e_=$g.zip;!function(e){var t,s,i=e.Reader,r=e.Writer;try{s=0===new Blob([new DataView(new ArrayBuffer(0))]).size;}catch(e){}function o(e){var t=this;function s(s,i){var r;t.data?s():((r=new XMLHttpRequest).addEventListener("load",(function(){t.size||(t.size=Number(r.getResponseHeader("Content-Length"))||Number(r.response.byteLength)),t.data=new Uint8Array(r.response),s();}),!1),r.addEventListener("error",i,!1),r.open("GET",e),r.responseType="arraybuffer",r.send());}t.size=0,t.init=function(i,r){if(function(e){var t=document.createElement("a");return t.href=e,"http:"===t.protocol||"https:"===t.protocol}(e)){var o=new XMLHttpRequest;o.addEventListener("load",(function(){t.size=Number(o.getResponseHeader("Content-Length")),t.size?i():s(i,r);}),!1),o.addEventListener("error",r,!1),o.open("HEAD",e),o.send();}else s(i,r);},t.readUint8Array=function(e,i,r,o){s((function(){r(new Uint8Array(t.data.subarray(e,e+i)));}),o);};}function n(e){var t=this;t.size=0,t.init=function(s,i){var r=new XMLHttpRequest;r.addEventListener("load",(function(){t.size=Number(r.getResponseHeader("Content-Length")),"bytes"==r.getResponseHeader("Accept-Ranges")?s():i("HTTP Range not supported.");}),!1),r.addEventListener("error",i,!1),r.open("HEAD",e),r.send();},t.readUint8Array=function(t,s,i,r){!function(t,s,i,r){var o=new XMLHttpRequest;o.open("GET",e),o.responseType="arraybuffer",o.setRequestHeader("Range","bytes="+t+"-"+(t+s-1)),o.addEventListener("load",(function(){i(o.response);}),!1),o.addEventListener("error",r,!1),o.send();}(t,s,(function(e){i(new Uint8Array(e));}),r);};}function a(e){var t=this;t.size=0,t.init=function(s,i){t.size=e.byteLength,s();},t.readUint8Array=function(t,s,i,r){i(new Uint8Array(e.slice(t,t+s)));};}function h(){var e,t=this;t.init=function(t,s){e=new Uint8Array,t();},t.writeUint8Array=function(t,s,i){var r=new Uint8Array(e.length+t.length);r.set(e),r.set(t,e.length),e=r,s();},t.getData=function(t){t(e.buffer);};}function l(e,t){var i,r=this;r.init=function(t,s){e.createWriter((function(e){i=e,t();}),s);},r.writeUint8Array=function(e,r,o){var n=new Blob([s?e:e.buffer],{type:t});i.onwrite=function(){i.onwrite=null,r();},i.onerror=o,i.write(n);},r.getData=function(t){e.file(t);};}o.prototype=new i,o.prototype.constructor=o,n.prototype=new i,n.prototype.constructor=n,a.prototype=new i,a.prototype.constructor=a,h.prototype=new r,h.prototype.constructor=h,l.prototype=new r,l.prototype.constructor=l,e.FileWriter=l,e.HttpReader=o,e.HttpRangeReader=n,e.ArrayBufferReader=a,e.ArrayBufferWriter=h,e.fs&&((t=e.fs.ZipDirectoryEntry).prototype.addHttpContent=function(s,i,r){return function(s,i,r,o){if(s.directory)return o?new t(s.fs,i,r,s):new e.fs.ZipFileEntry(s.fs,i,r,s);throw "Parent entry is not a directory."}(this,s,{data:i,Reader:r?n:o})},t.prototype.importHttpContent=function(e,t,s,i){this.importZip(t?new n(e):new o(e),s,i);},e.fs.FS.prototype.importHttpContent=function(e,s,i,r){this.entries=[],this.root=new t(this),this.root.importHttpContent(e,s,i,r);});}(e_);var f_,w_=e=>{if("undefined"!=typeof require)return require(e);throw new Error('Dynamic require of "'+e+'" is not supported')},P_=(e,t)=>function(){return t||(0, e[Object.keys(e)[0]])((t={exports:{}}).exports,t),t.exports},x_=P_({"(disabled):crypto"(){}}),M_=P_({"dist/web-ifc-mt.js"(e,t){var s,i=(s="undefined"!=typeof document&&document.currentScript?document.currentScript.src:void 0,"undefined"!=typeof __filename&&(s=s||__filename),function(e){function t(){return F.buffer!=O&&oe(F.buffer),L}function i(){return F.buffer!=O&&oe(F.buffer),N}function r(){return F.buffer!=O&&oe(F.buffer),k}function o(){return F.buffer!=O&&oe(F.buffer),j}function n(){return F.buffer!=O&&oe(F.buffer),G}function a(){return F.buffer!=O&&oe(F.buffer),H}function h(){return F.buffer!=O&&oe(F.buffer),U}var l,u,c=void 0!==(e=e||{})?e:{};c.ready=new Promise((function(e,t){l=e,u=t;}));var p,d={};for(p in c)c.hasOwnProperty(p)&&(d[p]=c[p]);var f,m,g,_,y="./this.program",v=function(e,t){throw t};f="object"==typeof window,m="function"==typeof importScripts,g="object"==typeof process&&"object"==typeof process.versions&&"string"==typeof process.versions.node,_=!f&&!g&&!m;var b=c.ENVIRONMENT_IS_PTHREAD||!1;b&&(O=c.buffer);var w,P,T,x,M="";function D(e){return c.locateFile?c.locateFile(e,M):M+e}if(g){var A;M=m?w_("path").dirname(M)+"/":__dirname+"/",w=function(e,t){return T||(T=w_("fs")),x||(x=w_("path")),e=x.normalize(e),T.readFileSync(e,t?null:"utf8")},P=function(e){var t=w(e,!0);return t.buffer||(t=new Uint8Array(t)),X(t.buffer),t},process.argv.length>1&&(y=process.argv[1].replace(/\\/g,"/")),process.argv.slice(2),process.on("uncaughtException",(function(e){if(!(e instanceof Pi))throw e})),process.on("unhandledRejection",ge),v=function(e){process.exit(e);},c.inspect=function(){return "[Emscripten Module object]"};try{A=w_("worker_threads");}catch(e){throw console.error('The "worker_threads" module is not supported in this node.js build - perhaps a newer version is needed?'),e}global.Worker=A.Worker;}else _?("undefined"!=typeof read&&(w=function(e){return read(e)}),P=function(e){var t;return "function"==typeof readbuffer?new Uint8Array(readbuffer(e)):(X("object"==typeof(t=read(e,"binary"))),t)},"undefined"!=typeof scriptArgs&&scriptArgs,"function"==typeof quit&&(v=function(e){quit(e);}),"undefined"!=typeof print&&("undefined"==typeof console&&(console={}),console.log=print,console.warn=console.error="undefined"!=typeof printErr?printErr:print)):(f||m)&&(m?M=self.location.href:"undefined"!=typeof document&&document.currentScript&&(M=document.currentScript.src),s&&(M=s),M=0!==M.indexOf("blob:")?M.substr(0,M.lastIndexOf("/")+1):"",g?(w=function(e,t){return T||(T=w_("fs")),x||(x=w_("path")),e=x.normalize(e),T.readFileSync(e,t?null:"utf8")},P=function(e){var t=w(e,!0);return t.buffer||(t=new Uint8Array(t)),X(t.buffer),t}):(w=function(e){var t=new XMLHttpRequest;return t.open("GET",e,!1),t.send(null),t.responseText},m&&(P=function(e){var t=new XMLHttpRequest;return t.open("GET",e,!1),t.responseType="arraybuffer",t.send(null),new Uint8Array(t.response)})));g&&"undefined"==typeof performance&&(global.performance=w_("perf_hooks").performance);var C,I,F,B,E=c.print||console.log.bind(console),S=c.printErr||console.warn.bind(console);for(p in d)d.hasOwnProperty(p)&&(c[p]=d[p]);function R(e){R.shown||(R.shown={}),R.shown[e]||(R.shown[e]=1,S(e));}d=null,c.arguments,c.thisProgram&&(y=c.thisProgram),c.quit&&(v=c.quit),c.wasmBinary&&(C=c.wasmBinary),c.noExitRuntime&&(I=c.noExitRuntime),"object"!=typeof WebAssembly&&ge("no native wasm support detected");var O,L,N,k,j,G,H,V,U,z=0,W=!1;function X(e,t){e||ge("Assertion failed: "+t);}function Y(e,t,s){for(var i=(t>>>=0)+s,r="";!(t>=i);){var o=e[t++>>>0];if(!o)return r;if(128&o){var n=63&e[t++>>>0];if(192!=(224&o)){var a=63&e[t++>>>0];if((o=224==(240&o)?(15&o)<<12|n<<6|a:(7&o)<<18|n<<12|a<<6|63&e[t++>>>0])<65536)r+=String.fromCharCode(o);else {var h=o-65536;r+=String.fromCharCode(55296|h>>10,56320|1023&h);}}else r+=String.fromCharCode((31&o)<<6|n);}else r+=String.fromCharCode(o);}return r}function K(e,t){return (e>>>=0)?Y(i(),e,t):""}function J(e,t,s,i){if(!(i>0))return 0;for(var r=s>>>=0,o=s+i-1,n=0;n<e.length;++n){var a=e.charCodeAt(n);if(a>=55296&&a<=57343&&(a=65536+((1023&a)<<10)|1023&e.charCodeAt(++n)),a<=127){if(s>=o)break;t[s++>>>0]=a;}else if(a<=2047){if(s+1>=o)break;t[s++>>>0]=192|a>>6,t[s++>>>0]=128|63&a;}else if(a<=65535){if(s+2>=o)break;t[s++>>>0]=224|a>>12,t[s++>>>0]=128|a>>6&63,t[s++>>>0]=128|63&a;}else {if(s+3>=o)break;t[s++>>>0]=240|a>>18,t[s++>>>0]=128|a>>12&63,t[s++>>>0]=128|a>>6&63,t[s++>>>0]=128|63&a;}}return t[s>>>0]=0,s-r}function Z(e,t,s){return J(e,i(),t,s)}function Q(e){for(var t=0,s=0;s<e.length;++s){var i=e.charCodeAt(s);i>=55296&&i<=57343&&(i=65536+((1023&i)<<10)|1023&e.charCodeAt(++s)),i<=127?++t:t+=i<=2047?2:i<=65535?3:4;}return t}function q(e,t){for(var s="",i=0;!(i>=t/2);++i){var o=r()[e+2*i>>1];if(0==o)break;s+=String.fromCharCode(o);}return s}function $(e,t,s){if(void 0===s&&(s=2147483647),s<2)return 0;for(var i=t,o=(s-=2)<2*e.length?s/2:e.length,n=0;n<o;++n){var a=e.charCodeAt(n);r()[t>>1]=a,t+=2;}return r()[t>>1]=0,t-i}function ee(e){return 2*e.length}function te(e,t){for(var s=0,i="";!(s>=t/4);){var r=n()[e+4*s>>2];if(0==r)break;if(++s,r>=65536){var o=r-65536;i+=String.fromCharCode(55296|o>>10,56320|1023&o);}else i+=String.fromCharCode(r);}return i}function se(e,t,s){if(void 0===s&&(s=2147483647),s<4)return 0;for(var i=t>>>=0,r=i+s-4,o=0;o<e.length;++o){var a=e.charCodeAt(o);if(a>=55296&&a<=57343&&(a=65536+((1023&a)<<10)|1023&e.charCodeAt(++o)),n()[t>>2]=a,(t+=4)+4>r)break}return n()[t>>2]=0,t-i}function ie(e){for(var t=0,s=0;s<e.length;++s){var i=e.charCodeAt(s);i>=55296&&i<=57343&&++s,t+=4;}return t}function re(e,t){return e%t>0&&(e+=t-e%t),e}function oe(e){O=e,c.HEAP8=L=new Int8Array(e),c.HEAP16=k=new Int16Array(e),c.HEAP32=G=new Int32Array(e),c.HEAPU8=N=new Uint8Array(e),c.HEAPU16=j=new Uint16Array(e),c.HEAPU32=H=new Uint32Array(e),c.HEAPF32=V=new Float32Array(e),c.HEAPF64=U=new Float64Array(e);}var ne,ae=c.INITIAL_MEMORY||16777216;if(b)F=c.wasmMemory,O=c.buffer;else if(c.wasmMemory)F=c.wasmMemory;else if(!((F=new WebAssembly.Memory({initial:ae/65536,maximum:65536,shared:!0})).buffer instanceof SharedArrayBuffer))throw S("requested a shared WebAssembly.Memory but the returned buffer is not a SharedArrayBuffer, indicating that while the browser has SharedArrayBuffer it does not have WebAssembly threads support - you may need to set a flag"),g&&console.log("(on node you may need: --experimental-wasm-threads --experimental-wasm-bulk-memory and also use a recent version)"),Error("bad memory");F&&(O=F.buffer),ae=O.byteLength,oe(O);var he=[],le=[],ue=[],ce=[],pe=0,de=null;function fe(e){X(!b,"addRunDependency cannot be used in a pthread worker"),pe++,c.monitorRunDependencies&&c.monitorRunDependencies(pe);}function me(e){if(pe--,c.monitorRunDependencies&&c.monitorRunDependencies(pe),0==pe&&de){var t=de;de=null,t();}}function ge(e){c.onAbort&&c.onAbort(e),b&&console.error("Pthread aborting at "+(new Error).stack),S(e+=""),W=!0,e="abort("+e+"). Build with -s ASSERTIONS=1 for more info.";var t=new WebAssembly.RuntimeError(e);throw u(t),t}function _e(e,t){return String.prototype.startsWith?e.startsWith(t):0===e.indexOf(t)}function ye(e){return _e(e,"data:application/octet-stream;base64,")}function ve(e){return _e(e,"file://")}c.preloadedImages={},c.preloadedAudios={};var be,we,Pe="web-ifc-mt.wasm";function Te(){try{if(C)return new Uint8Array(C);if(P)return P(Pe);throw "both async and sync fetching of the wasm failed"}catch(e){ge(e);}}ye(Pe)||(Pe=D(Pe));var xe={41793:function(e,t){setTimeout((function(){gi(e,t);}),0);},41871:function(){throw "Canceled!"}};function Me(e){for(;e.length>0;){var t=e.shift();if("function"!=typeof t){var s=t.func;"number"==typeof s?void 0===t.arg?ne.get(s)():ne.get(s)(t.arg):s(void 0===t.arg?null:t.arg);}else t(c);}}function De(e,t,s){return -1!=e.indexOf("j")?function(e,t,s){return s&&s.length?c["dynCall_"+e].apply(null,[t].concat(s)):c["dynCall_"+e].call(null,t)}(e,t,s):ne.get(t).apply(null,s)}c.dynCall=De;var Ae=0,Ce=0,Ie=0;function Fe(e,t,s){Ae=e|=0,Ie=t|=0,Ce=s|=0;}c.registerPthreadPtr=Fe;var Be=71,Ee=28;function Se(e,s){if(e<=0||e>t().length||!0&e||s<0)return -28;if(0==s)return 0;s>=2147483647&&(s=1/0);var i=Atomics.load(n(),Oe.mainThreadFutex>>2),r=0;if(i==e&&Atomics.compareExchange(n(),Oe.mainThreadFutex>>2,i,0)==i&&(r=1,--s<=0))return 1;var o=Atomics.notify(n(),e>>2,s);if(o>=0)return o+r;throw "Atomics.notify returned an unexpected value "+o}c._emscripten_futex_wake=Se;var Re,Oe={MAIN_THREAD_ID:1,mainThreadInfo:{schedPolicy:0,schedPrio:0},unusedWorkers:[],runningWorkers:[],initMainThreadBlock:function(){for(var e=navigator.hardwareConcurrency,t=0;t<e;++t)Oe.allocateUnusedWorker();},initRuntime:function(){Oe.mainThreadBlock=ii(232);for(var e=0;e<58;++e)a()[Oe.mainThreadBlock/4+e]=0;n()[Oe.mainThreadBlock+12>>2]=Oe.mainThreadBlock;var t=Oe.mainThreadBlock+156;n()[t>>2]=t;var s=ii(512);for(e=0;e<128;++e)a()[s/4+e]=0;Atomics.store(a(),Oe.mainThreadBlock+104>>2,s),Atomics.store(a(),Oe.mainThreadBlock+40>>2,Oe.mainThreadBlock),Atomics.store(a(),Oe.mainThreadBlock+44>>2,42),Oe.initShared(),Fe(Oe.mainThreadBlock,!m,1),mi(Oe.mainThreadBlock);},initWorker:function(){Oe.initShared(),l(c);},initShared:function(){Oe.mainThreadFutex=wi;},pthreads:{},threadExitHandlers:[],setThreadStatus:function(){},runExitHandlers:function(){for(;Oe.threadExitHandlers.length>0;)Oe.threadExitHandlers.pop()();b&&z&&di();},threadExit:function(e){var t=Vs();t&&(Atomics.store(a(),t+4>>2,e),Atomics.store(a(),t+0>>2,1),Atomics.store(a(),t+60>>2,1),Atomics.store(a(),t+64>>2,0),Oe.runExitHandlers(),Se(t+0,2147483647),Fe(0,0,0),z=0,b&&postMessage({cmd:"exit"}));},threadCancel:function(){Oe.runExitHandlers(),Atomics.store(a(),z+4>>2,-1),Atomics.store(a(),z+0>>2,1),Se(z+0,2147483647),z=0,Fe(0,0,0),postMessage({cmd:"cancelDone"});},terminateAllThreads:function(){for(var e in Oe.pthreads)(i=Oe.pthreads[e])&&i.worker&&Oe.returnWorkerToPool(i.worker);Oe.pthreads={};for(var t=0;t<Oe.unusedWorkers.length;++t)(s=Oe.unusedWorkers[t]).terminate();for(Oe.unusedWorkers=[],t=0;t<Oe.runningWorkers.length;++t){var s,i=(s=Oe.runningWorkers[t]).pthread;Oe.freeThreadData(i),s.terminate();}Oe.runningWorkers=[];},freeThreadData:function(e){if(e){if(e.threadInfoStruct){var t=n()[e.threadInfoStruct+104>>2];n()[e.threadInfoStruct+104>>2]=0,ri(t),ri(e.threadInfoStruct);}e.threadInfoStruct=0,e.allocatedOwnStack&&e.stackBase&&ri(e.stackBase),e.stackBase=0,e.worker&&(e.worker.pthread=null);}},returnWorkerToPool:function(e){delete Oe.pthreads[e.pthread.thread],Oe.unusedWorkers.push(e),Oe.runningWorkers.splice(Oe.runningWorkers.indexOf(e),1),Oe.freeThreadData(e.pthread),e.pthread=void 0;},receiveObjectTransfer:function(e){},loadWasmModuleToWorker:function(e,t){e.onmessage=function(s){var i=s.data,r=i.cmd;if(e.pthread&&(Oe.currentProxiedOperationCallerThread=e.pthread.threadInfoStruct),i.targetThread&&i.targetThread!=Vs()){var o=Oe.pthreads[i.targetThread];return o?o.worker.postMessage(s.data,i.transferList):console.error('Internal error! Worker sent a message "'+r+'" to target pthread '+i.targetThread+", but that thread no longer exists!"),void(Oe.currentProxiedOperationCallerThread=void 0)}"processQueuedMainThreadWork"===r?fi():"spawnThread"===r?Hs(s.data):"cleanupThread"===r?function(e){if(b)throw "Internal Error! cleanupThread() can only ever be called from main application thread!";if(!e)throw "Internal Error! Null pthread_ptr in cleanupThread!";n()[e+12>>2]=0;var t=Oe.pthreads[e];if(t){var s=t.worker;Oe.returnWorkerToPool(s);}}(i.thread):"killThread"===r?function(e){if(b)throw "Internal Error! killThread() can only ever be called from main application thread!";if(!e)throw "Internal Error! Null pthread_ptr in killThread!";n()[e+12>>2]=0;var t=Oe.pthreads[e];t.worker.terminate(),Oe.freeThreadData(t),Oe.runningWorkers.splice(Oe.runningWorkers.indexOf(t.worker),1),t.worker.pthread=void 0;}(i.thread):"cancelThread"===r?function(e){if(b)throw "Internal Error! cancelThread() can only ever be called from main application thread!";if(!e)throw "Internal Error! Null pthread_ptr in cancelThread!";Oe.pthreads[e].worker.postMessage({cmd:"cancel"});}(i.thread):"loaded"===r?(e.loaded=!0,t&&t(e),e.runPthread&&(e.runPthread(),delete e.runPthread)):"print"===r?E("Thread "+i.threadId+": "+i.text):"printErr"===r?S("Thread "+i.threadId+": "+i.text):"alert"===r?alert("Thread "+i.threadId+": "+i.text):"exit"===r?e.pthread&&Atomics.load(a(),e.pthread.thread+68>>2)&&Oe.returnWorkerToPool(e):"cancelDone"===r?Oe.returnWorkerToPool(e):"objectTransfer"===r?Oe.receiveObjectTransfer(s.data):"setimmediate"===s.data.target?e.postMessage(s.data):S("worker sent an unknown command "+r),Oe.currentProxiedOperationCallerThread=void 0;},e.onerror=function(e){S("pthread sent an error! "+e.filename+":"+e.lineno+": "+e.message);},g&&(e.on("message",(function(t){e.onmessage({data:t});})),e.on("error",(function(t){e.onerror(t);})),e.on("exit",(function(e){}))),e.postMessage({cmd:"load",urlOrBlob:c.mainScriptUrlOrBlob||s,wasmMemory:F,wasmModule:B});},allocateUnusedWorker:function(){var e=D("web-ifc-mt.worker.js");Oe.unusedWorkers.push(new Worker(e));},getNewWorker:function(){return 0==Oe.unusedWorkers.length&&(Oe.allocateUnusedWorker(),Oe.loadWasmModuleToWorker(Oe.unusedWorkers[0])),Oe.unusedWorkers.length>0?Oe.unusedWorkers.pop():null},busySpinWait:function(e){for(var t=performance.now()+e;performance.now()<t;);}};c.establishStackSpace=function(e,t){ci(e,t),li(e);},c.getNoExitRuntime=function(){return I},Re=g?function(){var e=process.hrtime();return 1e3*e[0]+e[1]/1e6}:b?function(){return performance.now()-c.__performance_now_clock_drift}:"undefined"!=typeof dateNow?dateNow:function(){return performance.now()};var Le=0,Ne=4,ke=8,je=12,Ge=13,He=16;function Ve(e){this.excPtr=e,this.ptr=e-He,this.set_type=function(e){n()[this.ptr+ke>>2]=e;},this.get_type=function(){return n()[this.ptr+ke>>2]},this.set_destructor=function(e){n()[this.ptr+Le>>2]=e;},this.get_destructor=function(){return n()[this.ptr+Le>>2]},this.set_refcount=function(e){n()[this.ptr+Ne>>2]=e;},this.set_caught=function(e){e=e?1:0,t()[this.ptr+je>>0]=e;},this.get_caught=function(){return 0!=t()[this.ptr+je>>0]},this.set_rethrown=function(e){e=e?1:0,t()[this.ptr+Ge>>0]=e;},this.get_rethrown=function(){return 0!=t()[this.ptr+Ge>>0]},this.init=function(e,t){this.set_type(e),this.set_destructor(t),this.set_refcount(0),this.set_caught(!1),this.set_rethrown(!1);},this.add_ref=function(){Atomics.add(n(),this.ptr+Ne>>2,1);},this.release_ref=function(){return 1===Atomics.sub(n(),this.ptr+Ne>>2,1)};}var Ue={splitPath:function(e){return /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(e).slice(1)},normalizeArray:function(e,t){for(var s=0,i=e.length-1;i>=0;i--){var r=e[i];"."===r?e.splice(i,1):".."===r?(e.splice(i,1),s++):s&&(e.splice(i,1),s--);}if(t)for(;s;s--)e.unshift("..");return e},normalize:function(e){var t="/"===e.charAt(0),s="/"===e.substr(-1);return e=Ue.normalizeArray(e.split("/").filter((function(e){return !!e})),!t).join("/"),e||t||(e="."),e&&s&&(e+="/"),(t?"/":"")+e},dirname:function(e){var t=Ue.splitPath(e),s=t[0],i=t[1];return s||i?(i&&(i=i.substr(0,i.length-1)),s+i):"."},basename:function(e){if("/"===e)return "/";var t=(e=(e=Ue.normalize(e)).replace(/\/$/,"")).lastIndexOf("/");return -1===t?e:e.substr(t+1)},extname:function(e){return Ue.splitPath(e)[3]},join:function(){var e=Array.prototype.slice.call(arguments,0);return Ue.normalize(e.join("/"))},join2:function(e,t){return Ue.normalize(e+"/"+t)}},ze={resolve:function(){for(var e="",t=!1,s=arguments.length-1;s>=-1&&!t;s--){var i=s>=0?arguments[s]:Ke.cwd();if("string"!=typeof i)throw new TypeError("Arguments to path.resolve must be strings");if(!i)return "";e=i+"/"+e,t="/"===i.charAt(0);}return e=Ue.normalizeArray(e.split("/").filter((function(e){return !!e})),!t).join("/"),(t?"/":"")+e||"."},relative:function(e,t){function s(e){for(var t=0;t<e.length&&""===e[t];t++);for(var s=e.length-1;s>=0&&""===e[s];s--);return t>s?[]:e.slice(t,s-t+1)}e=ze.resolve(e).substr(1),t=ze.resolve(t).substr(1);for(var i=s(e.split("/")),r=s(t.split("/")),o=Math.min(i.length,r.length),n=o,a=0;a<o;a++)if(i[a]!==r[a]){n=a;break}var h=[];for(a=n;a<i.length;a++)h.push("..");return (h=h.concat(r.slice(n))).join("/")}},We={ttys:[],init:function(){},shutdown:function(){},register:function(e,t){We.ttys[e]={input:[],output:[],ops:t},Ke.registerDevice(e,We.stream_ops);},stream_ops:{open:function(e){var t=We.ttys[e.node.rdev];if(!t)throw new Ke.ErrnoError(43);e.tty=t,e.seekable=!1;},close:function(e){e.tty.ops.flush(e.tty);},flush:function(e){e.tty.ops.flush(e.tty);},read:function(e,t,s,i,r){if(!e.tty||!e.tty.ops.get_char)throw new Ke.ErrnoError(60);for(var o=0,n=0;n<i;n++){var a;try{a=e.tty.ops.get_char(e.tty);}catch(e){throw new Ke.ErrnoError(29)}if(void 0===a&&0===o)throw new Ke.ErrnoError(6);if(null==a)break;o++,t[s+n]=a;}return o&&(e.node.timestamp=Date.now()),o},write:function(e,t,s,i,r){if(!e.tty||!e.tty.ops.put_char)throw new Ke.ErrnoError(60);try{for(var o=0;o<i;o++)e.tty.ops.put_char(e.tty,t[s+o]);}catch(e){throw new Ke.ErrnoError(29)}return i&&(e.node.timestamp=Date.now()),o}},default_tty_ops:{get_char:function(e){if(!e.input.length){var t=null;if(g){var s=Buffer.alloc?Buffer.alloc(256):new Buffer(256),i=0;try{i=T.readSync(process.stdin.fd,s,0,256,null);}catch(e){if(-1==e.toString().indexOf("EOF"))throw e;i=0;}t=i>0?s.slice(0,i).toString("utf-8"):null;}else "undefined"!=typeof window&&"function"==typeof window.prompt?null!==(t=window.prompt("Input: "))&&(t+="\n"):"function"==typeof readline&&null!==(t=readline())&&(t+="\n");if(!t)return null;e.input=ei(t,!0);}return e.input.shift()},put_char:function(e,t){null===t||10===t?(E(Y(e.output,0)),e.output=[]):0!=t&&e.output.push(t);},flush:function(e){e.output&&e.output.length>0&&(E(Y(e.output,0)),e.output=[]);}},default_tty1_ops:{put_char:function(e,t){null===t||10===t?(S(Y(e.output,0)),e.output=[]):0!=t&&e.output.push(t);},flush:function(e){e.output&&e.output.length>0&&(S(Y(e.output,0)),e.output=[]);}}};function Xe(e){for(var s=function(e,t){return t||(t=16),Math.ceil(e/t)*t}(e,16384),i=ii(s);e<s;)t()[i+e++]=0;return i}var Ye={ops_table:null,mount:function(e){return Ye.createNode(null,"/",16895,0)},createNode:function(e,t,s,i){if(Ke.isBlkdev(s)||Ke.isFIFO(s))throw new Ke.ErrnoError(63);Ye.ops_table||(Ye.ops_table={dir:{node:{getattr:Ye.node_ops.getattr,setattr:Ye.node_ops.setattr,lookup:Ye.node_ops.lookup,mknod:Ye.node_ops.mknod,rename:Ye.node_ops.rename,unlink:Ye.node_ops.unlink,rmdir:Ye.node_ops.rmdir,readdir:Ye.node_ops.readdir,symlink:Ye.node_ops.symlink},stream:{llseek:Ye.stream_ops.llseek}},file:{node:{getattr:Ye.node_ops.getattr,setattr:Ye.node_ops.setattr},stream:{llseek:Ye.stream_ops.llseek,read:Ye.stream_ops.read,write:Ye.stream_ops.write,allocate:Ye.stream_ops.allocate,mmap:Ye.stream_ops.mmap,msync:Ye.stream_ops.msync}},link:{node:{getattr:Ye.node_ops.getattr,setattr:Ye.node_ops.setattr,readlink:Ye.node_ops.readlink},stream:{}},chrdev:{node:{getattr:Ye.node_ops.getattr,setattr:Ye.node_ops.setattr},stream:Ke.chrdev_stream_ops}});var r=Ke.createNode(e,t,s,i);return Ke.isDir(r.mode)?(r.node_ops=Ye.ops_table.dir.node,r.stream_ops=Ye.ops_table.dir.stream,r.contents={}):Ke.isFile(r.mode)?(r.node_ops=Ye.ops_table.file.node,r.stream_ops=Ye.ops_table.file.stream,r.usedBytes=0,r.contents=null):Ke.isLink(r.mode)?(r.node_ops=Ye.ops_table.link.node,r.stream_ops=Ye.ops_table.link.stream):Ke.isChrdev(r.mode)&&(r.node_ops=Ye.ops_table.chrdev.node,r.stream_ops=Ye.ops_table.chrdev.stream),r.timestamp=Date.now(),e&&(e.contents[t]=r),r},getFileDataAsRegularArray:function(e){if(e.contents&&e.contents.subarray){for(var t=[],s=0;s<e.usedBytes;++s)t.push(e.contents[s]);return t}return e.contents},getFileDataAsTypedArray:function(e){return e.contents?e.contents.subarray?e.contents.subarray(0,e.usedBytes):new Uint8Array(e.contents):new Uint8Array(0)},expandFileStorage:function(e,t){t>>>=0;var s=e.contents?e.contents.length:0;if(!(s>=t)){t=Math.max(t,s*(s<1048576?2:1.125)>>>0),0!=s&&(t=Math.max(t,256));var i=e.contents;e.contents=new Uint8Array(t),e.usedBytes>0&&e.contents.set(i.subarray(0,e.usedBytes),0);}},resizeFileStorage:function(e,t){if(t>>>=0,e.usedBytes!=t){if(0==t)return e.contents=null,void(e.usedBytes=0);if(!e.contents||e.contents.subarray){var s=e.contents;return e.contents=new Uint8Array(t),s&&e.contents.set(s.subarray(0,Math.min(t,e.usedBytes))),void(e.usedBytes=t)}if(e.contents||(e.contents=[]),e.contents.length>t)e.contents.length=t;else for(;e.contents.length<t;)e.contents.push(0);e.usedBytes=t;}},node_ops:{getattr:function(e){var t={};return t.dev=Ke.isChrdev(e.mode)?e.id:1,t.ino=e.id,t.mode=e.mode,t.nlink=1,t.uid=0,t.gid=0,t.rdev=e.rdev,Ke.isDir(e.mode)?t.size=4096:Ke.isFile(e.mode)?t.size=e.usedBytes:Ke.isLink(e.mode)?t.size=e.link.length:t.size=0,t.atime=new Date(e.timestamp),t.mtime=new Date(e.timestamp),t.ctime=new Date(e.timestamp),t.blksize=4096,t.blocks=Math.ceil(t.size/t.blksize),t},setattr:function(e,t){void 0!==t.mode&&(e.mode=t.mode),void 0!==t.timestamp&&(e.timestamp=t.timestamp),void 0!==t.size&&Ye.resizeFileStorage(e,t.size);},lookup:function(e,t){throw Ke.genericErrors[44]},mknod:function(e,t,s,i){return Ye.createNode(e,t,s,i)},rename:function(e,t,s){if(Ke.isDir(e.mode)){var i;try{i=Ke.lookupNode(t,s);}catch(e){}if(i)for(var r in i.contents)throw new Ke.ErrnoError(55)}delete e.parent.contents[e.name],e.name=s,t.contents[s]=e,e.parent=t;},unlink:function(e,t){delete e.contents[t];},rmdir:function(e,t){var s=Ke.lookupNode(e,t);for(var i in s.contents)throw new Ke.ErrnoError(55);delete e.contents[t];},readdir:function(e){var t=[".",".."];for(var s in e.contents)e.contents.hasOwnProperty(s)&&t.push(s);return t},symlink:function(e,t,s){var i=Ye.createNode(e,t,41471,0);return i.link=s,i},readlink:function(e){if(!Ke.isLink(e.mode))throw new Ke.ErrnoError(28);return e.link}},stream_ops:{read:function(e,t,s,i,r){var o=e.node.contents;if(r>=e.node.usedBytes)return 0;var n=Math.min(e.node.usedBytes-r,i);if(n>8&&o.subarray)t.set(o.subarray(r,r+n),s);else for(var a=0;a<n;a++)t[s+a]=o[r+a];return n},write:function(e,s,i,r,o,n){if(s.buffer===t().buffer&&(n=!1),!r)return 0;var a=e.node;if(a.timestamp=Date.now(),s.subarray&&(!a.contents||a.contents.subarray)){if(n)return a.contents=s.subarray(i,i+r),a.usedBytes=r,r;if(0===a.usedBytes&&0===o)return a.contents=s.slice(i,i+r),a.usedBytes=r,r;if(o+r<=a.usedBytes)return a.contents.set(s.subarray(i,i+r),o),r}if(Ye.expandFileStorage(a,o+r),a.contents.subarray&&s.subarray)a.contents.set(s.subarray(i,i+r),o);else for(var h=0;h<r;h++)a.contents[o+h]=s[i+h];return a.usedBytes=Math.max(a.usedBytes,o+r),r},llseek:function(e,t,s){var i=t;if(1===s?i+=e.position:2===s&&Ke.isFile(e.node.mode)&&(i+=e.node.usedBytes),i<0)throw new Ke.ErrnoError(28);return i},allocate:function(e,t,s){Ye.expandFileStorage(e.node,t+s),e.node.usedBytes=Math.max(e.node.usedBytes,t+s);},mmap:function(e,s,i,r,o,n){if(X(0===s),!Ke.isFile(e.node.mode))throw new Ke.ErrnoError(43);var a,h,l=e.node.contents;if(2&n||l.buffer!==O){if((r>0||r+i<l.length)&&(l=l.subarray?l.subarray(r,r+i):Array.prototype.slice.call(l,r,r+i)),h=!0,!(a=Xe(i)))throw new Ke.ErrnoError(48);a>>>=0,t().set(l,a);}else h=!1,a=l.byteOffset;return {ptr:a,allocated:h}},msync:function(e,t,s,i,r){if(!Ke.isFile(e.node.mode))throw new Ke.ErrnoError(43);return 2&r||Ye.stream_ops.write(e,t,0,i,s,!1),0}}},Ke={root:null,mounts:[],devices:{},streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:!1,ignorePermissions:!0,trackingDelegate:{},tracking:{openFlags:{READ:1,WRITE:2}},ErrnoError:null,genericErrors:{},filesystems:null,syncFSRequests:0,lookupPath:function(e,t){if(t=t||{},!(e=ze.resolve(Ke.cwd(),e)))return {path:"",node:null};var s={follow_mount:!0,recurse_count:0};for(var i in s)void 0===t[i]&&(t[i]=s[i]);if(t.recurse_count>8)throw new Ke.ErrnoError(32);for(var r=Ue.normalizeArray(e.split("/").filter((function(e){return !!e})),!1),o=Ke.root,n="/",a=0;a<r.length;a++){var h=a===r.length-1;if(h&&t.parent)break;if(o=Ke.lookupNode(o,r[a]),n=Ue.join2(n,r[a]),Ke.isMountpoint(o)&&(!h||h&&t.follow_mount)&&(o=o.mounted.root),!h||t.follow)for(var l=0;Ke.isLink(o.mode);){var u=Ke.readlink(n);if(n=ze.resolve(Ue.dirname(n),u),o=Ke.lookupPath(n,{recurse_count:t.recurse_count}).node,l++>40)throw new Ke.ErrnoError(32)}}return {path:n,node:o}},getPath:function(e){for(var t;;){if(Ke.isRoot(e)){var s=e.mount.mountpoint;return t?"/"!==s[s.length-1]?s+"/"+t:s+t:s}t=t?e.name+"/"+t:e.name,e=e.parent;}},hashName:function(e,t){for(var s=0,i=0;i<t.length;i++)s=(s<<5)-s+t.charCodeAt(i)|0;return (e+s>>>0)%Ke.nameTable.length},hashAddNode:function(e){var t=Ke.hashName(e.parent.id,e.name);e.name_next=Ke.nameTable[t],Ke.nameTable[t]=e;},hashRemoveNode:function(e){var t=Ke.hashName(e.parent.id,e.name);if(Ke.nameTable[t]===e)Ke.nameTable[t]=e.name_next;else for(var s=Ke.nameTable[t];s;){if(s.name_next===e){s.name_next=e.name_next;break}s=s.name_next;}},lookupNode:function(e,t){var s=Ke.mayLookup(e);if(s)throw new Ke.ErrnoError(s,e);for(var i=Ke.hashName(e.id,t),r=Ke.nameTable[i];r;r=r.name_next){var o=r.name;if(r.parent.id===e.id&&o===t)return r}return Ke.lookup(e,t)},createNode:function(e,t,s,i){var r=new Ke.FSNode(e,t,s,i);return Ke.hashAddNode(r),r},destroyNode:function(e){Ke.hashRemoveNode(e);},isRoot:function(e){return e===e.parent},isMountpoint:function(e){return !!e.mounted},isFile:function(e){return 32768==(61440&e)},isDir:function(e){return 16384==(61440&e)},isLink:function(e){return 40960==(61440&e)},isChrdev:function(e){return 8192==(61440&e)},isBlkdev:function(e){return 24576==(61440&e)},isFIFO:function(e){return 4096==(61440&e)},isSocket:function(e){return 49152==(49152&e)},flagModes:{r:0,"r+":2,w:577,"w+":578,a:1089,"a+":1090},modeStringToFlags:function(e){var t=Ke.flagModes[e];if(void 0===t)throw new Error("Unknown file open mode: "+e);return t},flagsToPermissionString:function(e){var t=["r","w","rw"][3&e];return 512&e&&(t+="w"),t},nodePermissions:function(e,t){return Ke.ignorePermissions||(-1===t.indexOf("r")||292&e.mode)&&(-1===t.indexOf("w")||146&e.mode)&&(-1===t.indexOf("x")||73&e.mode)?0:2},mayLookup:function(e){var t=Ke.nodePermissions(e,"x");return t||(e.node_ops.lookup?0:2)},mayCreate:function(e,t){try{return Ke.lookupNode(e,t),20}catch(e){}return Ke.nodePermissions(e,"wx")},mayDelete:function(e,t,s){var i;try{i=Ke.lookupNode(e,t);}catch(e){return e.errno}var r=Ke.nodePermissions(e,"wx");if(r)return r;if(s){if(!Ke.isDir(i.mode))return 54;if(Ke.isRoot(i)||Ke.getPath(i)===Ke.cwd())return 10}else if(Ke.isDir(i.mode))return 31;return 0},mayOpen:function(e,t){return e?Ke.isLink(e.mode)?32:Ke.isDir(e.mode)&&("r"!==Ke.flagsToPermissionString(t)||512&t)?31:Ke.nodePermissions(e,Ke.flagsToPermissionString(t)):44},MAX_OPEN_FDS:4096,nextfd:function(e,t){e=e||0,t=t||Ke.MAX_OPEN_FDS;for(var s=e;s<=t;s++)if(!Ke.streams[s])return s;throw new Ke.ErrnoError(33)},getStream:function(e){return Ke.streams[e]},createStream:function(e,t,s){Ke.FSStream||(Ke.FSStream=function(){},Ke.FSStream.prototype={object:{get:function(){return this.node},set:function(e){this.node=e;}},isRead:{get:function(){return 1!=(2097155&this.flags)}},isWrite:{get:function(){return 0!=(2097155&this.flags)}},isAppend:{get:function(){return 1024&this.flags}}});var i=new Ke.FSStream;for(var r in e)i[r]=e[r];e=i;var o=Ke.nextfd(t,s);return e.fd=o,Ke.streams[o]=e,e},closeStream:function(e){Ke.streams[e]=null;},chrdev_stream_ops:{open:function(e){var t=Ke.getDevice(e.node.rdev);e.stream_ops=t.stream_ops,e.stream_ops.open&&e.stream_ops.open(e);},llseek:function(){throw new Ke.ErrnoError(70)}},major:function(e){return e>>8},minor:function(e){return 255&e},makedev:function(e,t){return e<<8|t},registerDevice:function(e,t){Ke.devices[e]={stream_ops:t};},getDevice:function(e){return Ke.devices[e]},getMounts:function(e){for(var t=[],s=[e];s.length;){var i=s.pop();t.push(i),s.push.apply(s,i.mounts);}return t},syncfs:function(e,t){"function"==typeof e&&(t=e,e=!1),Ke.syncFSRequests++,Ke.syncFSRequests>1&&S("warning: "+Ke.syncFSRequests+" FS.syncfs operations in flight at once, probably just doing extra work");var s=Ke.getMounts(Ke.root.mount),i=0;function r(e){return Ke.syncFSRequests--,t(e)}function o(e){if(e)return o.errored?void 0:(o.errored=!0,r(e));++i>=s.length&&r(null);}s.forEach((function(t){if(!t.type.syncfs)return o(null);t.type.syncfs(t,e,o);}));},mount:function(e,t,s){var i,r="/"===s,o=!s;if(r&&Ke.root)throw new Ke.ErrnoError(10);if(!r&&!o){var n=Ke.lookupPath(s,{follow_mount:!1});if(s=n.path,i=n.node,Ke.isMountpoint(i))throw new Ke.ErrnoError(10);if(!Ke.isDir(i.mode))throw new Ke.ErrnoError(54)}var a={type:e,opts:t,mountpoint:s,mounts:[]},h=e.mount(a);return h.mount=a,a.root=h,r?Ke.root=h:i&&(i.mounted=a,i.mount&&i.mount.mounts.push(a)),h},unmount:function(e){var t=Ke.lookupPath(e,{follow_mount:!1});if(!Ke.isMountpoint(t.node))throw new Ke.ErrnoError(28);var s=t.node,i=s.mounted,r=Ke.getMounts(i);Object.keys(Ke.nameTable).forEach((function(e){for(var t=Ke.nameTable[e];t;){var s=t.name_next;-1!==r.indexOf(t.mount)&&Ke.destroyNode(t),t=s;}})),s.mounted=null;var o=s.mount.mounts.indexOf(i);s.mount.mounts.splice(o,1);},lookup:function(e,t){return e.node_ops.lookup(e,t)},mknod:function(e,t,s){var i=Ke.lookupPath(e,{parent:!0}).node,r=Ue.basename(e);if(!r||"."===r||".."===r)throw new Ke.ErrnoError(28);var o=Ke.mayCreate(i,r);if(o)throw new Ke.ErrnoError(o);if(!i.node_ops.mknod)throw new Ke.ErrnoError(63);return i.node_ops.mknod(i,r,t,s)},create:function(e,t){return t=void 0!==t?t:438,t&=4095,t|=32768,Ke.mknod(e,t,0)},mkdir:function(e,t){return t=void 0!==t?t:511,t&=1023,t|=16384,Ke.mknod(e,t,0)},mkdirTree:function(e,t){for(var s=e.split("/"),i="",r=0;r<s.length;++r)if(s[r]){i+="/"+s[r];try{Ke.mkdir(i,t);}catch(e){if(20!=e.errno)throw e}}},mkdev:function(e,t,s){return void 0===s&&(s=t,t=438),t|=8192,Ke.mknod(e,t,s)},symlink:function(e,t){if(!ze.resolve(e))throw new Ke.ErrnoError(44);var s=Ke.lookupPath(t,{parent:!0}).node;if(!s)throw new Ke.ErrnoError(44);var i=Ue.basename(t),r=Ke.mayCreate(s,i);if(r)throw new Ke.ErrnoError(r);if(!s.node_ops.symlink)throw new Ke.ErrnoError(63);return s.node_ops.symlink(s,i,e)},rename:function(e,t){var s,i,r=Ue.dirname(e),o=Ue.dirname(t),n=Ue.basename(e),a=Ue.basename(t);if(s=Ke.lookupPath(e,{parent:!0}).node,i=Ke.lookupPath(t,{parent:!0}).node,!s||!i)throw new Ke.ErrnoError(44);if(s.mount!==i.mount)throw new Ke.ErrnoError(75);var h,l=Ke.lookupNode(s,n),u=ze.relative(e,o);if("."!==u.charAt(0))throw new Ke.ErrnoError(28);if("."!==(u=ze.relative(t,r)).charAt(0))throw new Ke.ErrnoError(55);try{h=Ke.lookupNode(i,a);}catch(e){}if(l!==h){var c=Ke.isDir(l.mode),p=Ke.mayDelete(s,n,c);if(p)throw new Ke.ErrnoError(p);if(p=h?Ke.mayDelete(i,a,c):Ke.mayCreate(i,a))throw new Ke.ErrnoError(p);if(!s.node_ops.rename)throw new Ke.ErrnoError(63);if(Ke.isMountpoint(l)||h&&Ke.isMountpoint(h))throw new Ke.ErrnoError(10);if(i!==s&&(p=Ke.nodePermissions(s,"w")))throw new Ke.ErrnoError(p);try{Ke.trackingDelegate.willMovePath&&Ke.trackingDelegate.willMovePath(e,t);}catch(s){S("FS.trackingDelegate['willMovePath']('"+e+"', '"+t+"') threw an exception: "+s.message);}Ke.hashRemoveNode(l);try{s.node_ops.rename(l,i,a);}catch(e){throw e}finally{Ke.hashAddNode(l);}try{Ke.trackingDelegate.onMovePath&&Ke.trackingDelegate.onMovePath(e,t);}catch(s){S("FS.trackingDelegate['onMovePath']('"+e+"', '"+t+"') threw an exception: "+s.message);}}},rmdir:function(e){var t=Ke.lookupPath(e,{parent:!0}).node,s=Ue.basename(e),i=Ke.lookupNode(t,s),r=Ke.mayDelete(t,s,!0);if(r)throw new Ke.ErrnoError(r);if(!t.node_ops.rmdir)throw new Ke.ErrnoError(63);if(Ke.isMountpoint(i))throw new Ke.ErrnoError(10);try{Ke.trackingDelegate.willDeletePath&&Ke.trackingDelegate.willDeletePath(e);}catch(t){S("FS.trackingDelegate['willDeletePath']('"+e+"') threw an exception: "+t.message);}t.node_ops.rmdir(t,s),Ke.destroyNode(i);try{Ke.trackingDelegate.onDeletePath&&Ke.trackingDelegate.onDeletePath(e);}catch(t){S("FS.trackingDelegate['onDeletePath']('"+e+"') threw an exception: "+t.message);}},readdir:function(e){var t=Ke.lookupPath(e,{follow:!0}).node;if(!t.node_ops.readdir)throw new Ke.ErrnoError(54);return t.node_ops.readdir(t)},unlink:function(e){var t=Ke.lookupPath(e,{parent:!0}).node,s=Ue.basename(e),i=Ke.lookupNode(t,s),r=Ke.mayDelete(t,s,!1);if(r)throw new Ke.ErrnoError(r);if(!t.node_ops.unlink)throw new Ke.ErrnoError(63);if(Ke.isMountpoint(i))throw new Ke.ErrnoError(10);try{Ke.trackingDelegate.willDeletePath&&Ke.trackingDelegate.willDeletePath(e);}catch(t){S("FS.trackingDelegate['willDeletePath']('"+e+"') threw an exception: "+t.message);}t.node_ops.unlink(t,s),Ke.destroyNode(i);try{Ke.trackingDelegate.onDeletePath&&Ke.trackingDelegate.onDeletePath(e);}catch(t){S("FS.trackingDelegate['onDeletePath']('"+e+"') threw an exception: "+t.message);}},readlink:function(e){var t=Ke.lookupPath(e).node;if(!t)throw new Ke.ErrnoError(44);if(!t.node_ops.readlink)throw new Ke.ErrnoError(28);return ze.resolve(Ke.getPath(t.parent),t.node_ops.readlink(t))},stat:function(e,t){var s=Ke.lookupPath(e,{follow:!t}).node;if(!s)throw new Ke.ErrnoError(44);if(!s.node_ops.getattr)throw new Ke.ErrnoError(63);return s.node_ops.getattr(s)},lstat:function(e){return Ke.stat(e,!0)},chmod:function(e,t,s){var i;if(!(i="string"==typeof e?Ke.lookupPath(e,{follow:!s}).node:e).node_ops.setattr)throw new Ke.ErrnoError(63);i.node_ops.setattr(i,{mode:4095&t|-4096&i.mode,timestamp:Date.now()});},lchmod:function(e,t){Ke.chmod(e,t,!0);},fchmod:function(e,t){var s=Ke.getStream(e);if(!s)throw new Ke.ErrnoError(8);Ke.chmod(s.node,t);},chown:function(e,t,s,i){var r;if(!(r="string"==typeof e?Ke.lookupPath(e,{follow:!i}).node:e).node_ops.setattr)throw new Ke.ErrnoError(63);r.node_ops.setattr(r,{timestamp:Date.now()});},lchown:function(e,t,s){Ke.chown(e,t,s,!0);},fchown:function(e,t,s){var i=Ke.getStream(e);if(!i)throw new Ke.ErrnoError(8);Ke.chown(i.node,t,s);},truncate:function(e,t){if(t<0)throw new Ke.ErrnoError(28);var s;if(!(s="string"==typeof e?Ke.lookupPath(e,{follow:!0}).node:e).node_ops.setattr)throw new Ke.ErrnoError(63);if(Ke.isDir(s.mode))throw new Ke.ErrnoError(31);if(!Ke.isFile(s.mode))throw new Ke.ErrnoError(28);var i=Ke.nodePermissions(s,"w");if(i)throw new Ke.ErrnoError(i);s.node_ops.setattr(s,{size:t,timestamp:Date.now()});},ftruncate:function(e,t){var s=Ke.getStream(e);if(!s)throw new Ke.ErrnoError(8);if(0==(2097155&s.flags))throw new Ke.ErrnoError(28);Ke.truncate(s.node,t);},utime:function(e,t,s){var i=Ke.lookupPath(e,{follow:!0}).node;i.node_ops.setattr(i,{timestamp:Math.max(t,s)});},open:function(e,t,s,i,r){if(""===e)throw new Ke.ErrnoError(44);var o;if(s=void 0===s?438:s,s=64&(t="string"==typeof t?Ke.modeStringToFlags(t):t)?4095&s|32768:0,"object"==typeof e)o=e;else {e=Ue.normalize(e);try{o=Ke.lookupPath(e,{follow:!(131072&t)}).node;}catch(e){}}var n=!1;if(64&t)if(o){if(128&t)throw new Ke.ErrnoError(20)}else o=Ke.mknod(e,s,0),n=!0;if(!o)throw new Ke.ErrnoError(44);if(Ke.isChrdev(o.mode)&&(t&=-513),65536&t&&!Ke.isDir(o.mode))throw new Ke.ErrnoError(54);if(!n){var a=Ke.mayOpen(o,t);if(a)throw new Ke.ErrnoError(a)}512&t&&Ke.truncate(o,0),t&=-131713;var h=Ke.createStream({node:o,path:Ke.getPath(o),flags:t,seekable:!0,position:0,stream_ops:o.stream_ops,ungotten:[],error:!1},i,r);h.stream_ops.open&&h.stream_ops.open(h),!c.logReadFiles||1&t||(Ke.readFiles||(Ke.readFiles={}),e in Ke.readFiles||(Ke.readFiles[e]=1,S("FS.trackingDelegate error on read file: "+e)));try{if(Ke.trackingDelegate.onOpenFile){var l=0;1!=(2097155&t)&&(l|=Ke.tracking.openFlags.READ),0!=(2097155&t)&&(l|=Ke.tracking.openFlags.WRITE),Ke.trackingDelegate.onOpenFile(e,l);}}catch(t){S("FS.trackingDelegate['onOpenFile']('"+e+"', flags) threw an exception: "+t.message);}return h},close:function(e){if(Ke.isClosed(e))throw new Ke.ErrnoError(8);e.getdents&&(e.getdents=null);try{e.stream_ops.close&&e.stream_ops.close(e);}catch(e){throw e}finally{Ke.closeStream(e.fd);}e.fd=null;},isClosed:function(e){return null===e.fd},llseek:function(e,t,s){if(Ke.isClosed(e))throw new Ke.ErrnoError(8);if(!e.seekable||!e.stream_ops.llseek)throw new Ke.ErrnoError(70);if(0!=s&&1!=s&&2!=s)throw new Ke.ErrnoError(28);return e.position=e.stream_ops.llseek(e,t,s),e.ungotten=[],e.position},read:function(e,t,s,i,r){if(s>>>=0,i<0||r<0)throw new Ke.ErrnoError(28);if(Ke.isClosed(e))throw new Ke.ErrnoError(8);if(1==(2097155&e.flags))throw new Ke.ErrnoError(8);if(Ke.isDir(e.node.mode))throw new Ke.ErrnoError(31);if(!e.stream_ops.read)throw new Ke.ErrnoError(28);var o=void 0!==r;if(o){if(!e.seekable)throw new Ke.ErrnoError(70)}else r=e.position;var n=e.stream_ops.read(e,t,s,i,r);return o||(e.position+=n),n},write:function(e,t,s,i,r,o){if(s>>>=0,i<0||r<0)throw new Ke.ErrnoError(28);if(Ke.isClosed(e))throw new Ke.ErrnoError(8);if(0==(2097155&e.flags))throw new Ke.ErrnoError(8);if(Ke.isDir(e.node.mode))throw new Ke.ErrnoError(31);if(!e.stream_ops.write)throw new Ke.ErrnoError(28);e.seekable&&1024&e.flags&&Ke.llseek(e,0,2);var n=void 0!==r;if(n){if(!e.seekable)throw new Ke.ErrnoError(70)}else r=e.position;var a=e.stream_ops.write(e,t,s,i,r,o);n||(e.position+=a);try{e.path&&Ke.trackingDelegate.onWriteToFile&&Ke.trackingDelegate.onWriteToFile(e.path);}catch(t){S("FS.trackingDelegate['onWriteToFile']('"+e.path+"') threw an exception: "+t.message);}return a},allocate:function(e,t,s){if(Ke.isClosed(e))throw new Ke.ErrnoError(8);if(t<0||s<=0)throw new Ke.ErrnoError(28);if(0==(2097155&e.flags))throw new Ke.ErrnoError(8);if(!Ke.isFile(e.node.mode)&&!Ke.isDir(e.node.mode))throw new Ke.ErrnoError(43);if(!e.stream_ops.allocate)throw new Ke.ErrnoError(138);e.stream_ops.allocate(e,t,s);},mmap:function(e,t,s,i,r,o){if(t>>>=0,0!=(2&r)&&0==(2&o)&&2!=(2097155&e.flags))throw new Ke.ErrnoError(2);if(1==(2097155&e.flags))throw new Ke.ErrnoError(2);if(!e.stream_ops.mmap)throw new Ke.ErrnoError(43);return e.stream_ops.mmap(e,t,s,i,r,o)},msync:function(e,t,s,i,r){return s>>>=0,e&&e.stream_ops.msync?e.stream_ops.msync(e,t,s,i,r):0},munmap:function(e){return 0},ioctl:function(e,t,s){if(!e.stream_ops.ioctl)throw new Ke.ErrnoError(59);return e.stream_ops.ioctl(e,t,s)},readFile:function(e,t){if((t=t||{}).flags=t.flags||0,t.encoding=t.encoding||"binary","utf8"!==t.encoding&&"binary"!==t.encoding)throw new Error('Invalid encoding type "'+t.encoding+'"');var s,i=Ke.open(e,t.flags),r=Ke.stat(e).size,o=new Uint8Array(r);return Ke.read(i,o,0,r,0),"utf8"===t.encoding?s=Y(o,0):"binary"===t.encoding&&(s=o),Ke.close(i),s},writeFile:function(e,t,s){(s=s||{}).flags=s.flags||577;var i=Ke.open(e,s.flags,s.mode);if("string"==typeof t){var r=new Uint8Array(Q(t)+1),o=J(t,r,0,r.length);Ke.write(i,r,0,o,void 0,s.canOwn);}else {if(!ArrayBuffer.isView(t))throw new Error("Unsupported data type");Ke.write(i,t,0,t.byteLength,void 0,s.canOwn);}Ke.close(i);},cwd:function(){return Ke.currentPath},chdir:function(e){var t=Ke.lookupPath(e,{follow:!0});if(null===t.node)throw new Ke.ErrnoError(44);if(!Ke.isDir(t.node.mode))throw new Ke.ErrnoError(54);var s=Ke.nodePermissions(t.node,"x");if(s)throw new Ke.ErrnoError(s);Ke.currentPath=t.path;},createDefaultDirectories:function(){Ke.mkdir("/tmp"),Ke.mkdir("/home"),Ke.mkdir("/home/web_user");},createDefaultDevices:function(){Ke.mkdir("/dev"),Ke.registerDevice(Ke.makedev(1,3),{read:function(){return 0},write:function(e,t,s,i,r){return i}}),Ke.mkdev("/dev/null",Ke.makedev(1,3)),We.register(Ke.makedev(5,0),We.default_tty_ops),We.register(Ke.makedev(6,0),We.default_tty1_ops),Ke.mkdev("/dev/tty",Ke.makedev(5,0)),Ke.mkdev("/dev/tty1",Ke.makedev(6,0));var e=function(){if("object"==typeof crypto&&"function"==typeof crypto.getRandomValues){var e=new Uint8Array(1);return function(){return crypto.getRandomValues(e),e[0]}}if(g)try{var t=x_();return function(){return t.randomBytes(1)[0]}}catch(e){}return function(){ge("randomDevice");}}();Ke.createDevice("/dev","random",e),Ke.createDevice("/dev","urandom",e),Ke.mkdir("/dev/shm"),Ke.mkdir("/dev/shm/tmp");},createSpecialDirectories:function(){Ke.mkdir("/proc"),Ke.mkdir("/proc/self"),Ke.mkdir("/proc/self/fd"),Ke.mount({mount:function(){var e=Ke.createNode("/proc/self","fd",16895,73);return e.node_ops={lookup:function(e,t){var s=+t,i=Ke.getStream(s);if(!i)throw new Ke.ErrnoError(8);var r={parent:null,mount:{mountpoint:"fake"},node_ops:{readlink:function(){return i.path}}};return r.parent=r,r}},e}},{},"/proc/self/fd");},createStandardStreams:function(){c.stdin?Ke.createDevice("/dev","stdin",c.stdin):Ke.symlink("/dev/tty","/dev/stdin"),c.stdout?Ke.createDevice("/dev","stdout",null,c.stdout):Ke.symlink("/dev/tty","/dev/stdout"),c.stderr?Ke.createDevice("/dev","stderr",null,c.stderr):Ke.symlink("/dev/tty1","/dev/stderr"),Ke.open("/dev/stdin",0),Ke.open("/dev/stdout",1),Ke.open("/dev/stderr",1);},ensureErrnoError:function(){Ke.ErrnoError||(Ke.ErrnoError=function(e,t){this.node=t,this.setErrno=function(e){this.errno=e;},this.setErrno(e),this.message="FS error";},Ke.ErrnoError.prototype=new Error,Ke.ErrnoError.prototype.constructor=Ke.ErrnoError,[44].forEach((function(e){Ke.genericErrors[e]=new Ke.ErrnoError(e),Ke.genericErrors[e].stack="<generic error, no stack>";})));},staticInit:function(){Ke.ensureErrnoError(),Ke.nameTable=new Array(4096),Ke.mount(Ye,{},"/"),Ke.createDefaultDirectories(),Ke.createDefaultDevices(),Ke.createSpecialDirectories(),Ke.filesystems={MEMFS:Ye};},init:function(e,t,s){Ke.init.initialized=!0,Ke.ensureErrnoError(),c.stdin=e||c.stdin,c.stdout=t||c.stdout,c.stderr=s||c.stderr,Ke.createStandardStreams();},quit:function(){Ke.init.initialized=!1;var e=c._fflush;e&&e(0);for(var t=0;t<Ke.streams.length;t++){var s=Ke.streams[t];s&&Ke.close(s);}},getMode:function(e,t){var s=0;return e&&(s|=365),t&&(s|=146),s},findObject:function(e,t){var s=Ke.analyzePath(e,t);return s.exists?s.object:null},analyzePath:function(e,t){try{e=(i=Ke.lookupPath(e,{follow:!t})).path;}catch(e){}var s={isRoot:!1,exists:!1,error:0,name:null,path:null,object:null,parentExists:!1,parentPath:null,parentObject:null};try{var i=Ke.lookupPath(e,{parent:!0});s.parentExists=!0,s.parentPath=i.path,s.parentObject=i.node,s.name=Ue.basename(e),i=Ke.lookupPath(e,{follow:!t}),s.exists=!0,s.path=i.path,s.object=i.node,s.name=i.node.name,s.isRoot="/"===i.path;}catch(e){s.error=e.errno;}return s},createPath:function(e,t,s,i){e="string"==typeof e?e:Ke.getPath(e);for(var r=t.split("/").reverse();r.length;){var o=r.pop();if(o){var n=Ue.join2(e,o);try{Ke.mkdir(n);}catch(e){}e=n;}}return n},createFile:function(e,t,s,i,r){var o=Ue.join2("string"==typeof e?e:Ke.getPath(e),t),n=Ke.getMode(i,r);return Ke.create(o,n)},createDataFile:function(e,t,s,i,r,o){var n=t?Ue.join2("string"==typeof e?e:Ke.getPath(e),t):e,a=Ke.getMode(i,r),h=Ke.create(n,a);if(s){if("string"==typeof s){for(var l=new Array(s.length),u=0,c=s.length;u<c;++u)l[u]=s.charCodeAt(u);s=l;}Ke.chmod(h,146|a);var p=Ke.open(h,577);Ke.write(p,s,0,s.length,0,o),Ke.close(p),Ke.chmod(h,a);}return h},createDevice:function(e,t,s,i){var r=Ue.join2("string"==typeof e?e:Ke.getPath(e),t),o=Ke.getMode(!!s,!!i);Ke.createDevice.major||(Ke.createDevice.major=64);var n=Ke.makedev(Ke.createDevice.major++,0);return Ke.registerDevice(n,{open:function(e){e.seekable=!1;},close:function(e){i&&i.buffer&&i.buffer.length&&i(10);},read:function(e,t,i,r,o){for(var n=0,a=0;a<r;a++){var h;try{h=s();}catch(e){throw new Ke.ErrnoError(29)}if(void 0===h&&0===n)throw new Ke.ErrnoError(6);if(null==h)break;n++,t[i+a]=h;}return n&&(e.node.timestamp=Date.now()),n},write:function(e,t,s,r,o){for(var n=0;n<r;n++)try{i(t[s+n]);}catch(e){throw new Ke.ErrnoError(29)}return r&&(e.node.timestamp=Date.now()),n}}),Ke.mkdev(r,o,n)},forceLoadFile:function(e){if(e.isDevice||e.isFolder||e.link||e.contents)return !0;if("undefined"!=typeof XMLHttpRequest)throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");if(!w)throw new Error("Cannot load without read() or XMLHttpRequest.");try{e.contents=ei(w(e.url),!0),e.usedBytes=e.contents.length;}catch(e){throw new Ke.ErrnoError(29)}},createLazyFile:function(e,t,s,i,r){function o(){this.lengthKnown=!1,this.chunks=[];}if(o.prototype.get=function(e){if(!(e>this.length-1||e<0)){var t=e%this.chunkSize,s=e/this.chunkSize|0;return this.getter(s)[t]}},o.prototype.setDataGetter=function(e){this.getter=e;},o.prototype.cacheLength=function(){var e=new XMLHttpRequest;if(e.open("HEAD",s,!1),e.send(null),!(e.status>=200&&e.status<300||304===e.status))throw new Error("Couldn't load "+s+". Status: "+e.status);var t,i=Number(e.getResponseHeader("Content-length")),r=(t=e.getResponseHeader("Accept-Ranges"))&&"bytes"===t,o=(t=e.getResponseHeader("Content-Encoding"))&&"gzip"===t,n=1048576;r||(n=i);var a=this;a.setDataGetter((function(e){var t=e*n,r=(e+1)*n-1;if(r=Math.min(r,i-1),void 0===a.chunks[e]&&(a.chunks[e]=function(e,t){if(e>t)throw new Error("invalid range ("+e+", "+t+") or no bytes requested!");if(t>i-1)throw new Error("only "+i+" bytes available! programmer error!");var r=new XMLHttpRequest;if(r.open("GET",s,!1),i!==n&&r.setRequestHeader("Range","bytes="+e+"-"+t),"undefined"!=typeof Uint8Array&&(r.responseType="arraybuffer"),r.overrideMimeType&&r.overrideMimeType("text/plain; charset=x-user-defined"),r.send(null),!(r.status>=200&&r.status<300||304===r.status))throw new Error("Couldn't load "+s+". Status: "+r.status);return void 0!==r.response?new Uint8Array(r.response||[]):ei(r.responseText||"",!0)}(t,r)),void 0===a.chunks[e])throw new Error("doXHR failed!");return a.chunks[e]})),!o&&i||(n=i=1,i=this.getter(0).length,n=i,E("LazyFiles on gzip forces download of the whole file when length is accessed")),this._length=i,this._chunkSize=n,this.lengthKnown=!0;},"undefined"!=typeof XMLHttpRequest){if(!m)throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";var n=new o;Object.defineProperties(n,{length:{get:function(){return this.lengthKnown||this.cacheLength(),this._length}},chunkSize:{get:function(){return this.lengthKnown||this.cacheLength(),this._chunkSize}}});var a={isDevice:!1,contents:n};}else a={isDevice:!1,url:s};var h=Ke.createFile(e,t,a,i,r);a.contents?h.contents=a.contents:a.url&&(h.contents=null,h.url=a.url),Object.defineProperties(h,{usedBytes:{get:function(){return this.contents.length}}});var l={};return Object.keys(h.stream_ops).forEach((function(e){var t=h.stream_ops[e];l[e]=function(){return Ke.forceLoadFile(h),t.apply(null,arguments)};})),l.read=function(e,t,s,i,r){Ke.forceLoadFile(h);var o=e.node.contents;if(r>=o.length)return 0;var n=Math.min(o.length-r,i);if(o.slice)for(var a=0;a<n;a++)t[s+a]=o[r+a];else for(a=0;a<n;a++)t[s+a]=o.get(r+a);return n},h.stream_ops=l,h},createPreloadedFile:function(e,t,s,i,r,o,n,a,h,l){Browser.init();var u=t?ze.resolve(Ue.join2(e,t)):e;function p(s){function p(s){l&&l(),a||Ke.createDataFile(e,t,s,i,r,h),o&&o(),me();}var d=!1;c.preloadPlugins.forEach((function(e){d||e.canHandle(u)&&(e.handle(s,u,p,(function(){n&&n(),me();})),d=!0);})),d||p(s);}fe(),"string"==typeof s?Browser.asyncLoad(s,(function(e){p(e);}),n):p(s);},indexedDB:function(){return window.indexedDB||window.mozIndexedDB||window.webkitIndexedDB||window.msIndexedDB},DB_NAME:function(){return "EM_FS_"+window.location.pathname},DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function(e,t,s){t=t||function(){},s=s||function(){};var i=Ke.indexedDB();try{var r=i.open(Ke.DB_NAME(),Ke.DB_VERSION);}catch(e){return s(e)}r.onupgradeneeded=function(){E("creating db"),r.result.createObjectStore(Ke.DB_STORE_NAME);},r.onsuccess=function(){var i=r.result.transaction([Ke.DB_STORE_NAME],"readwrite"),o=i.objectStore(Ke.DB_STORE_NAME),n=0,a=0,h=e.length;function l(){0==a?t():s();}e.forEach((function(e){var t=o.put(Ke.analyzePath(e).object.contents,e);t.onsuccess=function(){++n+a==h&&l();},t.onerror=function(){a++,n+a==h&&l();};})),i.onerror=s;},r.onerror=s;},loadFilesFromDB:function(e,t,s){t=t||function(){},s=s||function(){};var i=Ke.indexedDB();try{var r=i.open(Ke.DB_NAME(),Ke.DB_VERSION);}catch(e){return s(e)}r.onupgradeneeded=s,r.onsuccess=function(){var i=r.result;try{var o=i.transaction([Ke.DB_STORE_NAME],"readonly");}catch(e){return void s(e)}var n=o.objectStore(Ke.DB_STORE_NAME),a=0,h=0,l=e.length;function u(){0==h?t():s();}e.forEach((function(e){var t=n.get(e);t.onsuccess=function(){Ke.analyzePath(e).exists&&Ke.unlink(e),Ke.createDataFile(Ue.dirname(e),Ue.basename(e),t.result,!0,!0,!0),++a+h==l&&u();},t.onerror=function(){h++,a+h==l&&u();};})),o.onerror=s;},r.onerror=s;}},Je={mappings:{},DEFAULT_POLLMASK:5,umask:511,calculateAt:function(e,t){if("/"!==t[0]){var s;if(-100===e)s=Ke.cwd();else {var i=Ke.getStream(e);if(!i)throw new Ke.ErrnoError(8);s=i.path;}t=Ue.join2(s,t);}return t},doStat:function(e,t,s){try{var i=e(t);}catch(e){if(e&&e.node&&Ue.normalize(t)!==Ue.normalize(Ke.getPath(e.node)))return -54;throw e}return n()[s>>2]=i.dev,n()[s+4>>2]=0,n()[s+8>>2]=i.ino,n()[s+12>>2]=i.mode,n()[s+16>>2]=i.nlink,n()[s+20>>2]=i.uid,n()[s+24>>2]=i.gid,n()[s+28>>2]=i.rdev,n()[s+32>>2]=0,we=[i.size>>>0,(be=i.size,+Math.abs(be)>=1?be>0?(0|Math.min(+Math.floor(be/4294967296),4294967295))>>>0:~~+Math.ceil((be-+(~~be>>>0))/4294967296)>>>0:0)],n()[s+40>>2]=we[0],n()[s+44>>2]=we[1],n()[s+48>>2]=4096,n()[s+52>>2]=i.blocks,n()[s+56>>2]=i.atime.getTime()/1e3|0,n()[s+60>>2]=0,n()[s+64>>2]=i.mtime.getTime()/1e3|0,n()[s+68>>2]=0,n()[s+72>>2]=i.ctime.getTime()/1e3|0,n()[s+76>>2]=0,we=[i.ino>>>0,(be=i.ino,+Math.abs(be)>=1?be>0?(0|Math.min(+Math.floor(be/4294967296),4294967295))>>>0:~~+Math.ceil((be-+(~~be>>>0))/4294967296)>>>0:0)],n()[s+80>>2]=we[0],n()[s+84>>2]=we[1],0},doMsync:function(e,t,s,r,o){var n=i().slice(e,e+s);Ke.msync(t,n,o,s,r);},doMkdir:function(e,t){return "/"===(e=Ue.normalize(e))[e.length-1]&&(e=e.substr(0,e.length-1)),Ke.mkdir(e,t,0),0},doMknod:function(e,t,s){switch(61440&t){case 32768:case 8192:case 24576:case 4096:case 49152:break;default:return -28}return Ke.mknod(e,t,s),0},doReadlink:function(e,s,i){if(i<=0)return -28;var r=Ke.readlink(e),o=Math.min(i,Q(r)),n=t()[s+o];return Z(r,s,i+1),t()[s+o]=n,o},doAccess:function(e,t){if(-8&t)return -28;var s;if(!(s=Ke.lookupPath(e,{follow:!0}).node))return -44;var i="";return 4&t&&(i+="r"),2&t&&(i+="w"),1&t&&(i+="x"),i&&Ke.nodePermissions(s,i)?-2:0},doDup:function(e,t,s){var i=Ke.getStream(s);return i&&Ke.close(i),Ke.open(e,t,0,s,s).fd},doReadv:function(e,s,i,r){for(var o=0,a=0;a<i;a++){var h=n()[s+8*a>>2],l=n()[s+(8*a+4)>>2],u=Ke.read(e,t(),h,l,r);if(u<0)return -1;if(o+=u,u<l)break}return o},doWritev:function(e,s,i,r){for(var o=0,a=0;a<i;a++){var h=n()[s+8*a>>2],l=n()[s+(8*a+4)>>2],u=Ke.write(e,t(),h,l,r);if(u<0)return -1;o+=u;}return o},varargs:void 0,get:function(){return Je.varargs+=4,n()[Je.varargs-4>>2]},getStr:function(e){return K(e)},getStreamFromFD:function(e){var t=Ke.getStream(e);if(!t)throw new Ke.ErrnoError(8);return t},get64:function(e,t){return e}};function Ze(e,t,s){if(b)return bs(2,1,e,t,s);Je.varargs=s;try{var i=Je.getStreamFromFD(e);switch(t){case 21509:case 21505:case 21510:case 21511:case 21512:case 21506:case 21507:case 21508:case 21523:case 21524:return i.tty?0:-59;case 21519:if(!i.tty)return -59;var r=Je.get();return n()[r>>2]=0,0;case 21520:return i.tty?-28:-59;case 21531:return r=Je.get(),Ke.ioctl(i,t,r);default:ge("bad ioctl syscall "+t);}}catch(e){return void 0!==Ke&&e instanceof Ke.ErrnoError||ge(e),-e.errno}}function Qe(e,t,s){if(b)return bs(3,1,e,t,s);Je.varargs=s;try{var i=Je.getStr(e),r=Je.get();return Ke.open(i,t,r).fd}catch(e){return void 0!==Ke&&e instanceof Ke.ErrnoError||ge(e),-e.errno}}var qe={};function $e(e){for(;e.length;){var t=e.pop();e.pop()(t);}}function et(e){return this.fromWireType(a()[e>>2])}var tt={},st={},it={};function rt(e){if(void 0===e)return "_unknown";var t=(e=e.replace(/[^a-zA-Z0-9_]/g,"$")).charCodeAt(0);return t>=48&&t<=57?"_"+e:e}function ot(e,t){return e=rt(e),new Function("body","return function "+e+'() {\n    "use strict";    return body.apply(this, arguments);\n};\n')(t)}function nt(e,t){var s=ot(t,(function(e){this.name=t,this.message=e;var s=new Error(e).stack;void 0!==s&&(this.stack=this.toString()+"\n"+s.replace(/^Error(:[^\n]*)?\n/,""));}));return s.prototype=Object.create(e.prototype),s.prototype.constructor=s,s.prototype.toString=function(){return void 0===this.message?this.name:this.name+": "+this.message},s}var at=void 0;function ht(e){throw new at(e)}function lt(e,t,s){function i(t){var i=s(t);i.length!==e.length&&ht("Mismatched type converter count");for(var r=0;r<e.length;++r)gt(e[r],i[r]);}e.forEach((function(e){it[e]=t;}));var r=new Array(t.length),o=[],n=0;t.forEach((function(e,t){st.hasOwnProperty(e)?r[t]=st[e]:(o.push(e),tt.hasOwnProperty(e)||(tt[e]=[]),tt[e].push((function(){r[t]=st[e],++n===o.length&&i(r);})));})),0===o.length&&i(r);}var ut={};function ct(e){switch(e){case 1:return 0;case 2:return 1;case 4:return 2;case 8:return 3;default:throw new TypeError("Unknown type size: "+e)}}var pt=void 0;function dt(e){for(var t="",s=e;i()[s];)t+=pt[i()[s++]];return t}var ft=void 0;function mt(e){throw new ft(e)}function gt(e,t,s){if(s=s||{},!("argPackAdvance"in t))throw new TypeError("registerType registeredInstance requires argPackAdvance");var i=t.name;if(e||mt('type "'+i+'" must have a positive integer typeid pointer'),st.hasOwnProperty(e)){if(s.ignoreDuplicateRegistrations)return;mt("Cannot register type '"+i+"' twice");}if(st[e]=t,delete it[e],tt.hasOwnProperty(e)){var r=tt[e];delete tt[e],r.forEach((function(e){e();}));}}function _t(e){if(!(this instanceof Bt))return !1;if(!(e instanceof Bt))return !1;for(var t=this.$$.ptrType.registeredClass,s=this.$$.ptr,i=e.$$.ptrType.registeredClass,r=e.$$.ptr;t.baseClass;)s=t.upcast(s),t=t.baseClass;for(;i.baseClass;)r=i.upcast(r),i=i.baseClass;return t===i&&s===r}function yt(e){return {count:e.count,deleteScheduled:e.deleteScheduled,preservePointerOnDelete:e.preservePointerOnDelete,ptr:e.ptr,ptrType:e.ptrType,smartPtr:e.smartPtr,smartPtrType:e.smartPtrType}}function vt(e){mt(e.$$.ptrType.registeredClass.name+" instance already deleted");}var bt=!1;function wt(e){}function Pt(e){e.count.value-=1,0===e.count.value&&function(e){e.smartPtr?e.smartPtrType.rawDestructor(e.smartPtr):e.ptrType.registeredClass.rawDestructor(e.ptr);}(e);}function Tt(e){return "undefined"==typeof FinalizationGroup?(Tt=function(e){return e},e):(bt=new FinalizationGroup((function(e){for(var t=e.next();!t.done;t=e.next()){var s=t.value;s.ptr?Pt(s):console.warn("object already deleted: "+s.ptr);}})),wt=function(e){bt.unregister(e.$$);},(Tt=function(e){return bt.register(e,e.$$,e.$$),e})(e))}function xt(){if(this.$$.ptr||vt(this),this.$$.preservePointerOnDelete)return this.$$.count.value+=1,this;var e=Tt(Object.create(Object.getPrototypeOf(this),{$$:{value:yt(this.$$)}}));return e.$$.count.value+=1,e.$$.deleteScheduled=!1,e}function Mt(){this.$$.ptr||vt(this),this.$$.deleteScheduled&&!this.$$.preservePointerOnDelete&&mt("Object already scheduled for deletion"),wt(this),Pt(this.$$),this.$$.preservePointerOnDelete||(this.$$.smartPtr=void 0,this.$$.ptr=void 0);}function Dt(){return !this.$$.ptr}var At=void 0,Ct=[];function It(){for(;Ct.length;){var e=Ct.pop();e.$$.deleteScheduled=!1,e.delete();}}function Ft(){return this.$$.ptr||vt(this),this.$$.deleteScheduled&&!this.$$.preservePointerOnDelete&&mt("Object already scheduled for deletion"),Ct.push(this),1===Ct.length&&At&&At(It),this.$$.deleteScheduled=!0,this}function Bt(){}var Et={};function St(e,t,s){if(void 0===e[t].overloadTable){var i=e[t];e[t]=function(){return e[t].overloadTable.hasOwnProperty(arguments.length)||mt("Function '"+s+"' called with an invalid number of arguments ("+arguments.length+") - expects one of ("+e[t].overloadTable+")!"),e[t].overloadTable[arguments.length].apply(this,arguments)},e[t].overloadTable=[],e[t].overloadTable[i.argCount]=i;}}function Rt(e,t,s){c.hasOwnProperty(e)?((void 0===s||void 0!==c[e].overloadTable&&void 0!==c[e].overloadTable[s])&&mt("Cannot register public name '"+e+"' twice"),St(c,e,e),c.hasOwnProperty(s)&&mt("Cannot register multiple overloads of a function with the same number of arguments ("+s+")!"),c[e].overloadTable[s]=t):(c[e]=t,void 0!==s&&(c[e].numArguments=s));}function Ot(e,t,s,i,r,o,n,a){this.name=e,this.constructor=t,this.instancePrototype=s,this.rawDestructor=i,this.baseClass=r,this.getActualType=o,this.upcast=n,this.downcast=a,this.pureVirtualFunctions=[];}function Lt(e,t,s){for(;t!==s;)t.upcast||mt("Expected null or instance of "+s.name+", got an instance of "+t.name),e=t.upcast(e),t=t.baseClass;return e}function Nt(e,t){if(null===t)return this.isReference&&mt("null is not a valid "+this.name),0;t.$$||mt('Cannot pass "'+ds(t)+'" as a '+this.name),t.$$.ptr||mt("Cannot pass deleted object as a pointer of type "+this.name);var s=t.$$.ptrType.registeredClass;return Lt(t.$$.ptr,s,this.registeredClass)}function kt(e,t){var s;if(null===t)return this.isReference&&mt("null is not a valid "+this.name),this.isSmartPointer?(s=this.rawConstructor(),null!==e&&e.push(this.rawDestructor,s),s):0;t.$$||mt('Cannot pass "'+ds(t)+'" as a '+this.name),t.$$.ptr||mt("Cannot pass deleted object as a pointer of type "+this.name),!this.isConst&&t.$$.ptrType.isConst&&mt("Cannot convert argument of type "+(t.$$.smartPtrType?t.$$.smartPtrType.name:t.$$.ptrType.name)+" to parameter type "+this.name);var i=t.$$.ptrType.registeredClass;if(s=Lt(t.$$.ptr,i,this.registeredClass),this.isSmartPointer)switch(void 0===t.$$.smartPtr&&mt("Passing raw pointer to smart pointer is illegal"),this.sharingPolicy){case 0:t.$$.smartPtrType===this?s=t.$$.smartPtr:mt("Cannot convert argument of type "+(t.$$.smartPtrType?t.$$.smartPtrType.name:t.$$.ptrType.name)+" to parameter type "+this.name);break;case 1:s=t.$$.smartPtr;break;case 2:if(t.$$.smartPtrType===this)s=t.$$.smartPtr;else {var r=t.clone();s=this.rawShare(s,us((function(){r.delete();}))),null!==e&&e.push(this.rawDestructor,s);}break;default:mt("Unsupporting sharing policy");}return s}function jt(e,t){if(null===t)return this.isReference&&mt("null is not a valid "+this.name),0;t.$$||mt('Cannot pass "'+ds(t)+'" as a '+this.name),t.$$.ptr||mt("Cannot pass deleted object as a pointer of type "+this.name),t.$$.ptrType.isConst&&mt("Cannot convert argument of type "+t.$$.ptrType.name+" to parameter type "+this.name);var s=t.$$.ptrType.registeredClass;return Lt(t.$$.ptr,s,this.registeredClass)}function Gt(e){return this.rawGetPointee&&(e=this.rawGetPointee(e)),e}function Ht(e){this.rawDestructor&&this.rawDestructor(e);}function Vt(e){null!==e&&e.delete();}function Ut(e,t,s){if(t===s)return e;if(void 0===s.baseClass)return null;var i=Ut(e,t,s.baseClass);return null===i?null:s.downcast(i)}function zt(){return Object.keys(Yt).length}function Wt(){var e=[];for(var t in Yt)Yt.hasOwnProperty(t)&&e.push(Yt[t]);return e}function Xt(e){At=e,Ct.length&&At&&At(It);}var Yt={};function Kt(e,t){return t=function(e,t){for(void 0===t&&mt("ptr should not be undefined");e.baseClass;)t=e.upcast(t),e=e.baseClass;return t}(e,t),Yt[t]}function Jt(e,t){return t.ptrType&&t.ptr||ht("makeClassHandle requires ptr and ptrType"),!!t.smartPtrType!=!!t.smartPtr&&ht("Both smartPtrType and smartPtr must be specified"),t.count={value:1},Tt(Object.create(e,{$$:{value:t}}))}function Zt(e){var t=this.getPointee(e);if(!t)return this.destructor(e),null;var s=Kt(this.registeredClass,t);if(void 0!==s){if(0===s.$$.count.value)return s.$$.ptr=t,s.$$.smartPtr=e,s.clone();var i=s.clone();return this.destructor(e),i}function r(){return this.isSmartPointer?Jt(this.registeredClass.instancePrototype,{ptrType:this.pointeeType,ptr:t,smartPtrType:this,smartPtr:e}):Jt(this.registeredClass.instancePrototype,{ptrType:this,ptr:e})}var o,n=this.registeredClass.getActualType(t),a=Et[n];if(!a)return r.call(this);o=this.isConst?a.constPointerType:a.pointerType;var h=Ut(t,this.registeredClass,o.registeredClass);return null===h?r.call(this):this.isSmartPointer?Jt(o.registeredClass.instancePrototype,{ptrType:o,ptr:h,smartPtrType:this,smartPtr:e}):Jt(o.registeredClass.instancePrototype,{ptrType:o,ptr:h})}function Qt(e,t,s,i,r,o,n,a,h,l,u){this.name=e,this.registeredClass=t,this.isReference=s,this.isConst=i,this.isSmartPointer=r,this.pointeeType=o,this.sharingPolicy=n,this.rawGetPointee=a,this.rawConstructor=h,this.rawShare=l,this.rawDestructor=u,r||void 0!==t.baseClass?this.toWireType=kt:i?(this.toWireType=Nt,this.destructorFunction=null):(this.toWireType=jt,this.destructorFunction=null);}function qt(e,t,s){c.hasOwnProperty(e)||ht("Replacing nonexistant public symbol"),void 0!==c[e].overloadTable&&void 0!==s?c[e].overloadTable[s]=t:(c[e]=t,c[e].argCount=s);}function $t(e,t){var s=-1!=(e=dt(e)).indexOf("j")?function(e,t){X(e.indexOf("j")>=0,"getDynCaller should only be called with i64 sigs");var s=[];return function(){s.length=arguments.length;for(var i=0;i<arguments.length;i++)s[i]=arguments[i];return De(e,t,s)}}(e,t):ne.get(t);return "function"!=typeof s&&mt("unknown function pointer with signature "+e+": "+t),s}var es=void 0;function ts(e){var t=oi(e),s=dt(t);return ri(t),s}function ss(e,t){var s=[],i={};throw t.forEach((function e(t){i[t]||st[t]||(it[t]?it[t].forEach(e):(s.push(t),i[t]=!0));})),new es(e+": "+s.map(ts).join([", "]))}function is(e,t){for(var s=[],i=0;i<e;i++)s.push(n()[(t>>2)+i]);return s}function rs(e,t,s,i,r){var o=t.length;o<2&&mt("argTypes array size mismatch! Must at least get return value and 'this' types!");for(var n=null!==t[1]&&null!==s,a=!1,h=1;h<t.length;++h)if(null!==t[h]&&void 0===t[h].destructorFunction){a=!0;break}var l="void"!==t[0].name,u="",c="";for(h=0;h<o-2;++h)u+=(0!==h?", ":"")+"arg"+h,c+=(0!==h?", ":"")+"arg"+h+"Wired";var p="return function "+rt(e)+"("+u+") {\nif (arguments.length !== "+(o-2)+") {\nthrowBindingError('function "+e+" called with ' + arguments.length + ' arguments, expected "+(o-2)+" args!');\n}\n";a&&(p+="var destructors = [];\n");var d=a?"destructors":"null",f=["throwBindingError","invoker","fn","runDestructors","retType","classParam"],m=[mt,i,r,$e,t[0],t[1]];for(n&&(p+="var thisWired = classParam.toWireType("+d+", this);\n"),h=0;h<o-2;++h)p+="var arg"+h+"Wired = argType"+h+".toWireType("+d+", arg"+h+"); // "+t[h+2].name+"\n",f.push("argType"+h),m.push(t[h+2]);if(n&&(c="thisWired"+(c.length>0?", ":"")+c),p+=(l?"var rv = ":"")+"invoker(fn"+(c.length>0?", ":"")+c+");\n",a)p+="runDestructors(destructors);\n";else for(h=n?1:2;h<t.length;++h){var g=1===h?"thisWired":"arg"+(h-2)+"Wired";null!==t[h].destructorFunction&&(p+=g+"_dtor("+g+"); // "+t[h].name+"\n",f.push(g+"_dtor"),m.push(t[h].destructorFunction));}l&&(p+="var ret = retType.fromWireType(rv);\nreturn ret;\n"),p+="}\n",f.push(p);var _=function(e,t){if(!(e instanceof Function))throw new TypeError("new_ called with constructor type "+typeof e+" which is not a function");var s=ot(e.name||"unknownFunctionName",(function(){}));s.prototype=e.prototype;var i=new s,r=e.apply(i,t);return r instanceof Object?r:i}(Function,f).apply(null,m);return _}var os=[],ns=[{},{value:void 0},{value:null},{value:!0},{value:!1}];function as(e){e>4&&0==--ns[e].refcount&&(ns[e]=void 0,os.push(e));}function hs(){for(var e=0,t=5;t<ns.length;++t)void 0!==ns[t]&&++e;return e}function ls(){for(var e=5;e<ns.length;++e)if(void 0!==ns[e])return ns[e];return null}function us(e){switch(e){case void 0:return 1;case null:return 2;case!0:return 3;case!1:return 4;default:var t=os.length?os.pop():ns.length;return ns[t]={refcount:1,value:e},t}}function cs(e,s,h){switch(s){case 0:return function(e){var s=h?t():i();return this.fromWireType(s[e>>>0])};case 1:return function(e){var t=h?r():o();return this.fromWireType(t[e>>>1])};case 2:return function(e){var t=h?n():a();return this.fromWireType(t[e>>>2])};default:throw new TypeError("Unknown integer type: "+e)}}function ps(e,t){var s=st[e];return void 0===s&&mt(t+" has unknown type "+ts(e)),s}function ds(e){if(null===e)return "null";var t=typeof e;return "object"===t||"array"===t||"function"===t?e.toString():""+e}function fs(e,t){switch(t){case 2:return function(e){return this.fromWireType((F.buffer!=O&&oe(F.buffer),V)[e>>2])};case 3:return function(e){return this.fromWireType(h()[e>>3])};default:throw new TypeError("Unknown float type: "+e)}}function ms(e,s,h){switch(s){case 0:return h?function(e){return t()[e]}:function(e){return i()[e]};case 1:return h?function(e){return r()[e>>1]}:function(e){return o()[e>>1]};case 2:return h?function(e){return n()[e>>2]}:function(e){return a()[e>>2]};default:throw new TypeError("Unknown integer type: "+e)}}function gs(e){return e||mt("Cannot use deleted val. handle = "+e),ns[e].value}var _s={};function ys(e){var t=_s[e];return void 0===t?dt(e):t}function vs(){return "object"==typeof globalThis?globalThis:Function("return this")()}function bs(e,t){for(var s=arguments.length-2,i=hi(),r=ui(8*s),o=r>>3,n=0;n<s;n++)h()[o+n]=arguments[2+n];var a=yi(e,s,r,t);return li(i),a}var ws=[],Ps=[];function Ts(e){try{return F.grow(e-O.byteLength+65535>>>16),oe(F.buffer),1}catch(e){}}var xs={inEventHandler:0,removeAllEventListeners:function(){for(var e=xs.eventHandlers.length-1;e>=0;--e)xs._removeHandler(e);xs.eventHandlers=[],xs.deferredCalls=[];},registerRemoveEventListeners:function(){xs.removeEventListenersRegistered||(xs.removeEventListenersRegistered=!0);},deferredCalls:[],deferCall:function(e,t,s){function i(e,t){if(e.length!=t.length)return !1;for(var s in e)if(e[s]!=t[s])return !1;return !0}for(var r in xs.deferredCalls){var o=xs.deferredCalls[r];if(o.targetFunction==e&&i(o.argsList,s))return}xs.deferredCalls.push({targetFunction:e,precedence:t,argsList:s}),xs.deferredCalls.sort((function(e,t){return e.precedence<t.precedence}));},removeDeferredCalls:function(e){for(var t=0;t<xs.deferredCalls.length;++t)xs.deferredCalls[t].targetFunction==e&&(xs.deferredCalls.splice(t,1),--t);},canPerformEventHandlerRequests:function(){return xs.inEventHandler&&xs.currentEventHandler.allowsDeferredCalls},runDeferredCalls:function(){if(xs.canPerformEventHandlerRequests())for(var e=0;e<xs.deferredCalls.length;++e){var t=xs.deferredCalls[e];xs.deferredCalls.splice(e,1),--e,t.targetFunction.apply(null,t.argsList);}},eventHandlers:[],removeAllHandlersOnTarget:function(e,t){for(var s=0;s<xs.eventHandlers.length;++s)xs.eventHandlers[s].target!=e||t&&t!=xs.eventHandlers[s].eventTypeString||xs._removeHandler(s--);},_removeHandler:function(e){var t=xs.eventHandlers[e];t.target.removeEventListener(t.eventTypeString,t.eventListenerFunc,t.useCapture),xs.eventHandlers.splice(e,1);},registerOrRemoveHandler:function(e){var t=function(t){++xs.inEventHandler,xs.currentEventHandler=e,xs.runDeferredCalls(),e.handlerFunc(t),xs.runDeferredCalls(),--xs.inEventHandler;};if(e.callbackfunc)e.eventListenerFunc=t,e.target.addEventListener(e.eventTypeString,t,e.useCapture),xs.eventHandlers.push(e),xs.registerRemoveEventListeners();else for(var s=0;s<xs.eventHandlers.length;++s)xs.eventHandlers[s].target==e.target&&xs.eventHandlers[s].eventTypeString==e.eventTypeString&&xs._removeHandler(s--);},queueEventHandlerOnThread_iiii:function(e,t,s,i,r){var o=hi(),a=ui(12);n()[a>>2]=s,n()[a+4>>2]=i,n()[a+8>>2]=r,vi(0,e,637534208,t,i,a),li(o);},getTargetThreadForEventCallback:function(e){switch(e){case 1:return 0;case 2:return Oe.currentProxiedOperationCallerThread;default:return e}},getNodeNameForTarget:function(e){return e?e==window?"#window":e==screen?"#screen":e&&e.nodeName?e.nodeName:"":""},fullscreenEnabled:function(){return document.fullscreenEnabled||document.webkitFullscreenEnabled}};function Ms(e,t,s,i){var r,o,a,h=hi(),l=ui(12),u=0;t&&(o=Q(r=t)+1,a=ii(o),Z(r,a,o),u=a),n()[l>>2]=u,n()[l+4>>2]=s,n()[l+8>>2]=i,vi(0,e,657457152,0,u,l),li(h);}var Ds=[0,"undefined"!=typeof document?document:0,"undefined"!=typeof window?window:0];function As(e){var t;return e=(t=e)>2?K(t):t,Ds[e]||("undefined"!=typeof document?document.querySelector(e):void 0)}function Cs(e){return As(e)}function Is(e,t,s){var i=Cs(e);if(!i)return -4;if(i.canvasSharedPtr&&(n()[i.canvasSharedPtr>>2]=t,n()[i.canvasSharedPtr+4>>2]=s),!i.offscreenCanvas&&i.controlTransferredOffscreen)return i.canvasSharedPtr?(function(e,t,s,i){Ms(e,t=t?K(t):"",s,i);}(n()[i.canvasSharedPtr+8>>2],e,t,s),1):-4;i.offscreenCanvas&&(i=i.offscreenCanvas);var r=!1;if(i.GLctxObject&&i.GLctxObject.GLctx){var o=i.GLctxObject.GLctx.getParameter(2978);r=0===o[0]&&0===o[1]&&o[2]===i.width&&o[3]===i.height;}return i.width=t,i.height=s,r&&i.GLctxObject.GLctx.viewport(0,0,t,s),0}function Fs(e,t,s){return b?bs(4,1,e,t,s):Is(e,t,s)}var Bs={counter:1,buffers:[],programs:[],framebuffers:[],renderbuffers:[],textures:[],uniforms:[],shaders:[],vaos:[],contexts:{},offscreenCanvases:{},timerQueriesEXT:[],programInfos:{},stringCache:{},unpackAlignment:4,recordError:function(e){Bs.lastError||(Bs.lastError=e);},getNewId:function(e){for(var t=Bs.counter++,s=e.length;s<t;s++)e[s]=null;return t},getSource:function(e,t,s,i){for(var r="",o=0;o<t;++o){var a=i?n()[i+4*o>>2]:-1;r+=K(n()[s+4*o>>2],a<0?void 0:a);}return r},createContext:function(e,t){var s=e.getContext("webgl",t);return s?Bs.registerContext(s,t):0},registerContext:function(e,t){var s=ii(8);n()[s+4>>2]=Vs();var i={handle:s,attributes:t,version:t.majorVersion,GLctx:e};return e.canvas&&(e.canvas.GLctxObject=i),Bs.contexts[s]=i,(void 0===t.enableExtensionsByDefault||t.enableExtensionsByDefault)&&Bs.initExtensions(i),s},makeContextCurrent:function(e){return Bs.currentContext=Bs.contexts[e],c.ctx=Js=Bs.currentContext&&Bs.currentContext.GLctx,!(e&&!Js)},getContext:function(e){return Bs.contexts[e]},deleteContext:function(e){Bs.currentContext===Bs.contexts[e]&&(Bs.currentContext=null),"object"==typeof xs&&xs.removeAllHandlersOnTarget(Bs.contexts[e].GLctx.canvas),Bs.contexts[e]&&Bs.contexts[e].GLctx.canvas&&(Bs.contexts[e].GLctx.canvas.GLctxObject=void 0),ri(Bs.contexts[e].handle),Bs.contexts[e]=null;},initExtensions:function(e){if(e||(e=Bs.currentContext),!e.initExtensionsDone){e.initExtensionsDone=!0;var t,s=e.GLctx;!function(e){var t=e.getExtension("ANGLE_instanced_arrays");t&&(e.vertexAttribDivisor=function(e,s){t.vertexAttribDivisorANGLE(e,s);},e.drawArraysInstanced=function(e,s,i,r){t.drawArraysInstancedANGLE(e,s,i,r);},e.drawElementsInstanced=function(e,s,i,r,o){t.drawElementsInstancedANGLE(e,s,i,r,o);});}(s),function(e){var t=e.getExtension("OES_vertex_array_object");t&&(e.createVertexArray=function(){return t.createVertexArrayOES()},e.deleteVertexArray=function(e){t.deleteVertexArrayOES(e);},e.bindVertexArray=function(e){t.bindVertexArrayOES(e);},e.isVertexArray=function(e){return t.isVertexArrayOES(e)});}(s),function(e){var t=e.getExtension("WEBGL_draw_buffers");t&&(e.drawBuffers=function(e,s){t.drawBuffersWEBGL(e,s);});}(s),s.disjointTimerQueryExt=s.getExtension("EXT_disjoint_timer_query"),(t=s).multiDrawWebgl=t.getExtension("WEBGL_multi_draw");var i=["OES_texture_float","OES_texture_half_float","OES_standard_derivatives","OES_vertex_array_object","WEBGL_compressed_texture_s3tc","WEBGL_depth_texture","OES_element_index_uint","EXT_texture_filter_anisotropic","EXT_frag_depth","WEBGL_draw_buffers","ANGLE_instanced_arrays","OES_texture_float_linear","OES_texture_half_float_linear","EXT_blend_minmax","EXT_shader_texture_lod","EXT_texture_norm16","WEBGL_compressed_texture_pvrtc","EXT_color_buffer_half_float","WEBGL_color_buffer_float","EXT_sRGB","WEBGL_compressed_texture_etc1","EXT_disjoint_timer_query","WEBGL_compressed_texture_etc","WEBGL_compressed_texture_astc","EXT_color_buffer_float","WEBGL_compressed_texture_s3tc_srgb","EXT_disjoint_timer_query_webgl2","WEBKIT_WEBGL_compressed_texture_pvrtc"];(s.getSupportedExtensions()||[]).forEach((function(e){-1!=i.indexOf(e)&&s.getExtension(e);}));}},populateUniformTable:function(e){for(var t=Bs.programs[e],s=Bs.programInfos[e]={uniforms:{},maxUniformLength:0,maxAttributeLength:-1,maxUniformBlockNameLength:-1},i=s.uniforms,r=Js.getProgramParameter(t,35718),o=0;o<r;++o){var n=Js.getActiveUniform(t,o),a=n.name;s.maxUniformLength=Math.max(s.maxUniformLength,a.length+1),"]"==a.slice(-1)&&(a=a.slice(0,a.lastIndexOf("[")));var h=Js.getUniformLocation(t,a);if(h){var l=Bs.getNewId(Bs.uniforms);i[a]=[n.size,l],Bs.uniforms[l]=h;for(var u=1;u<n.size;++u){var c=a+"["+u+"]";h=Js.getUniformLocation(t,c),l=Bs.getNewId(Bs.uniforms),Bs.uniforms[l]=h;}}}}},Es=["default","low-power","high-performance"],Ss={};function Rs(){if(!Rs.strings){var e={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:("object"==typeof navigator&&navigator.languages&&navigator.languages[0]||"C").replace("-","_")+".UTF-8",_:y||"./this.program"};for(var t in Ss)e[t]=Ss[t];var s=[];for(var t in e)s.push(t+"="+e[t]);Rs.strings=s;}return Rs.strings}function Os(e,s){if(b)return bs(5,1,e,s);try{var i=0;return Rs().forEach((function(r,o){var a=s+i;n()[e+4*o>>2]=a,function(e,s,i){for(var r=0;r<e.length;++r)t()[s++>>0]=e.charCodeAt(r);i||(t()[s>>0]=0);}(r,a),i+=r.length+1;})),0}catch(e){return void 0!==Ke&&e instanceof Ke.ErrnoError||ge(e),e.errno}}function Ls(e,t){if(b)return bs(6,1,e,t);try{var s=Rs();n()[e>>2]=s.length;var i=0;return s.forEach((function(e){i+=e.length+1;})),n()[t>>2]=i,0}catch(e){return void 0!==Ke&&e instanceof Ke.ErrnoError||ge(e),e.errno}}function Ns(e){if(b)return bs(7,1,e);try{var t=Je.getStreamFromFD(e);return Ke.close(t),0}catch(e){return void 0!==Ke&&e instanceof Ke.ErrnoError||ge(e),e.errno}}function ks(e,t,s,i){if(b)return bs(8,1,e,t,s,i);try{var r=Je.getStreamFromFD(e),o=Je.doReadv(r,t,s);return n()[i>>2]=o,0}catch(e){return void 0!==Ke&&e instanceof Ke.ErrnoError||ge(e),e.errno}}function js(e,t,s,i,r){if(b)return bs(9,1,e,t,s,i,r);try{var o=Je.getStreamFromFD(e),a=4294967296*s+(t>>>0),h=9007199254740992;return a<=-h||a>=h?-61:(Ke.llseek(o,a,i),we=[o.position>>>0,(be=o.position,+Math.abs(be)>=1?be>0?(0|Math.min(+Math.floor(be/4294967296),4294967295))>>>0:~~+Math.ceil((be-+(~~be>>>0))/4294967296)>>>0:0)],n()[r>>2]=we[0],n()[r+4>>2]=we[1],o.getdents&&0===a&&0===i&&(o.getdents=null),0)}catch(e){return void 0!==Ke&&e instanceof Ke.ErrnoError||ge(e),e.errno}}function Gs(e,t,s,i){if(b)return bs(10,1,e,t,s,i);try{var r=Je.getStreamFromFD(e),o=Je.doWritev(r,t,s);return n()[i>>2]=o,0}catch(e){return void 0!==Ke&&e instanceof Ke.ErrnoError||ge(e),e.errno}}function Hs(e){if(b)throw "Internal Error! spawnThread() can only ever be called from main application thread!";var t=Oe.getNewWorker();if(void 0!==t.pthread)throw "Internal error!";if(!e.pthread_ptr)throw "Internal error, no pthread ptr!";Oe.runningWorkers.push(t);for(var s=ii(512),i=0;i<128;++i)n()[s+4*i>>2]=0;var r=e.stackBase+e.stackSize,o=Oe.pthreads[e.pthread_ptr]={worker:t,stackBase:e.stackBase,stackSize:e.stackSize,allocatedOwnStack:e.allocatedOwnStack,thread:e.pthread_ptr,threadInfoStruct:e.pthread_ptr},h=o.threadInfoStruct>>2;Atomics.store(a(),h+0,0),Atomics.store(a(),h+1,0),Atomics.store(a(),h+2,0),Atomics.store(a(),h+17,e.detached),Atomics.store(a(),h+26,s),Atomics.store(a(),h+12,0),Atomics.store(a(),h+10,o.threadInfoStruct),Atomics.store(a(),h+11,42),Atomics.store(a(),h+27,e.stackSize),Atomics.store(a(),h+21,e.stackSize),Atomics.store(a(),h+20,r),Atomics.store(a(),h+29,r),Atomics.store(a(),h+30,e.detached),Atomics.store(a(),h+32,e.schedPolicy),Atomics.store(a(),h+33,e.schedPrio);var l=ai()+40;Atomics.store(a(),h+44,l),t.pthread=o;var u={cmd:"run",start_routine:e.startRoutine,arg:e.arg,threadInfoStruct:e.pthread_ptr,selfThreadId:e.pthread_ptr,parentThreadId:e.parent_pthread_ptr,stackBase:e.stackBase,stackSize:e.stackSize};t.runPthread=function(){u.time=performance.now(),t.postMessage(u,e.transferList);},t.loaded&&(t.runPthread(),delete t.runPthread);}function Vs(){return 0|Ae}function Us(e){return e%4==0&&(e%100!=0||e%400==0)}function zs(e,t){for(var s=0,i=0;i<=t;s+=e[i++]);return s}c._pthread_self=Vs;var Ws=[31,29,31,30,31,30,31,31,30,31,30,31],Xs=[31,28,31,30,31,30,31,31,30,31,30,31];function Ys(e,t){for(var s=new Date(e.getTime());t>0;){var i=Us(s.getFullYear()),r=s.getMonth(),o=(i?Ws:Xs)[r];if(!(t>o-s.getDate()))return s.setDate(s.getDate()+t),s;t-=o-s.getDate()+1,s.setDate(1),r<11?s.setMonth(r+1):(s.setMonth(0),s.setFullYear(s.getFullYear()+1));}return s}function Ks(e,s,i,r){var o=n()[r+40>>2],a={tm_sec:n()[r>>2],tm_min:n()[r+4>>2],tm_hour:n()[r+8>>2],tm_mday:n()[r+12>>2],tm_mon:n()[r+16>>2],tm_year:n()[r+20>>2],tm_wday:n()[r+24>>2],tm_yday:n()[r+28>>2],tm_isdst:n()[r+32>>2],tm_gmtoff:n()[r+36>>2],tm_zone:o?K(o):""},h=K(i),l={"%c":"%a %b %d %H:%M:%S %Y","%D":"%m/%d/%y","%F":"%Y-%m-%d","%h":"%b","%r":"%I:%M:%S %p","%R":"%H:%M","%T":"%H:%M:%S","%x":"%m/%d/%y","%X":"%H:%M:%S","%Ec":"%c","%EC":"%C","%Ex":"%m/%d/%y","%EX":"%H:%M:%S","%Ey":"%y","%EY":"%Y","%Od":"%d","%Oe":"%e","%OH":"%H","%OI":"%I","%Om":"%m","%OM":"%M","%OS":"%S","%Ou":"%u","%OU":"%U","%OV":"%V","%Ow":"%w","%OW":"%W","%Oy":"%y"};for(var u in l)h=h.replace(new RegExp(u,"g"),l[u]);var c=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],p=["January","February","March","April","May","June","July","August","September","October","November","December"];function d(e,t,s){for(var i="number"==typeof e?e.toString():e||"";i.length<t;)i=s[0]+i;return i}function f(e,t){return d(e,t,"0")}function m(e,t){function s(e){return e<0?-1:e>0?1:0}var i;return 0===(i=s(e.getFullYear()-t.getFullYear()))&&0===(i=s(e.getMonth()-t.getMonth()))&&(i=s(e.getDate()-t.getDate())),i}function g(e){switch(e.getDay()){case 0:return new Date(e.getFullYear()-1,11,29);case 1:return e;case 2:return new Date(e.getFullYear(),0,3);case 3:return new Date(e.getFullYear(),0,2);case 4:return new Date(e.getFullYear(),0,1);case 5:return new Date(e.getFullYear()-1,11,31);case 6:return new Date(e.getFullYear()-1,11,30)}}function _(e){var t=Ys(new Date(e.tm_year+1900,0,1),e.tm_yday),s=new Date(t.getFullYear(),0,4),i=new Date(t.getFullYear()+1,0,4),r=g(s),o=g(i);return m(r,t)<=0?m(o,t)<=0?t.getFullYear()+1:t.getFullYear():t.getFullYear()-1}var y={"%a":function(e){return c[e.tm_wday].substring(0,3)},"%A":function(e){return c[e.tm_wday]},"%b":function(e){return p[e.tm_mon].substring(0,3)},"%B":function(e){return p[e.tm_mon]},"%C":function(e){return f((e.tm_year+1900)/100|0,2)},"%d":function(e){return f(e.tm_mday,2)},"%e":function(e){return d(e.tm_mday,2," ")},"%g":function(e){return _(e).toString().substring(2)},"%G":function(e){return _(e)},"%H":function(e){return f(e.tm_hour,2)},"%I":function(e){var t=e.tm_hour;return 0==t?t=12:t>12&&(t-=12),f(t,2)},"%j":function(e){return f(e.tm_mday+zs(Us(e.tm_year+1900)?Ws:Xs,e.tm_mon-1),3)},"%m":function(e){return f(e.tm_mon+1,2)},"%M":function(e){return f(e.tm_min,2)},"%n":function(){return "\n"},"%p":function(e){return e.tm_hour>=0&&e.tm_hour<12?"AM":"PM"},"%S":function(e){return f(e.tm_sec,2)},"%t":function(){return "\t"},"%u":function(e){return e.tm_wday||7},"%U":function(e){var t=new Date(e.tm_year+1900,0,1),s=0===t.getDay()?t:Ys(t,7-t.getDay()),i=new Date(e.tm_year+1900,e.tm_mon,e.tm_mday);if(m(s,i)<0){var r=zs(Us(i.getFullYear())?Ws:Xs,i.getMonth()-1)-31,o=31-s.getDate()+r+i.getDate();return f(Math.ceil(o/7),2)}return 0===m(s,t)?"01":"00"},"%V":function(e){var t,s=new Date(e.tm_year+1900,0,4),i=new Date(e.tm_year+1901,0,4),r=g(s),o=g(i),n=Ys(new Date(e.tm_year+1900,0,1),e.tm_yday);return m(n,r)<0?"53":m(o,n)<=0?"01":(t=r.getFullYear()<e.tm_year+1900?e.tm_yday+32-r.getDate():e.tm_yday+1-r.getDate(),f(Math.ceil(t/7),2))},"%w":function(e){return e.tm_wday},"%W":function(e){var t=new Date(e.tm_year,0,1),s=1===t.getDay()?t:Ys(t,0===t.getDay()?1:7-t.getDay()+1),i=new Date(e.tm_year+1900,e.tm_mon,e.tm_mday);if(m(s,i)<0){var r=zs(Us(i.getFullYear())?Ws:Xs,i.getMonth()-1)-31,o=31-s.getDate()+r+i.getDate();return f(Math.ceil(o/7),2)}return 0===m(s,t)?"01":"00"},"%y":function(e){return (e.tm_year+1900).toString().substring(2)},"%Y":function(e){return e.tm_year+1900},"%z":function(e){var t=e.tm_gmtoff,s=t>=0;return t=(t=Math.abs(t)/60)/60*100+t%60,(s?"+":"-")+String("0000"+t).slice(-4)},"%Z":function(e){return e.tm_zone},"%%":function(){return "%"}};for(var u in y)h.indexOf(u)>=0&&(h=h.replace(new RegExp(u,"g"),y[u](a)));var v,b,w=ei(h,!1);return w.length>s?0:(v=w,b=e,t().set(v,b),w.length-1)}b||Oe.initMainThreadBlock();var Js,Zs=function(e,t,s,i){e||(e=this),this.parent=e,this.mount=e.mount,this.mounted=null,this.id=Ke.nextInode++,this.name=t,this.mode=s,this.node_ops={},this.stream_ops={},this.rdev=i;},Qs=365,qs=146;Object.defineProperties(Zs.prototype,{read:{get:function(){return (this.mode&Qs)===Qs},set:function(e){e?this.mode|=Qs:this.mode&=-366;}},write:{get:function(){return (this.mode&qs)===qs},set:function(e){e?this.mode|=qs:this.mode&=-147;}},isFolder:{get:function(){return Ke.isDir(this.mode)}},isDevice:{get:function(){return Ke.isChrdev(this.mode)}}}),Ke.FSNode=Zs,Ke.staticInit(),c.FS_createPath=Ke.createPath,c.FS_createDataFile=Ke.createDataFile,c.FS_createPreloadedFile=Ke.createPreloadedFile,c.FS_createLazyFile=Ke.createLazyFile,c.FS_createDevice=Ke.createDevice,c.FS_unlink=Ke.unlink,at=c.InternalError=nt(Error,"InternalError"),function(){for(var e=new Array(256),t=0;t<256;++t)e[t]=String.fromCharCode(t);pt=e;}(),ft=c.BindingError=nt(Error,"BindingError"),Bt.prototype.isAliasOf=_t,Bt.prototype.clone=xt,Bt.prototype.delete=Mt,Bt.prototype.isDeleted=Dt,Bt.prototype.deleteLater=Ft,Qt.prototype.getPointee=Gt,Qt.prototype.destructor=Ht,Qt.prototype.argPackAdvance=8,Qt.prototype.readValueFromPointer=et,Qt.prototype.deleteObject=Vt,Qt.prototype.fromWireType=Zt,c.getInheritedInstanceCount=zt,c.getLiveInheritedInstances=Wt,c.flushPendingDeletes=It,c.setDelayFunction=Xt,es=c.UnboundTypeError=nt(Error,"UnboundTypeError"),c.count_emval_handles=hs,c.get_first_emval=ls;var $s=[null,function(e,t){if(b)return bs(1,1,e,t)},Ze,Qe,Fs,Os,Ls,Ns,ks,js,Gs];function ei(e,t,s){var i=s>0?s:Q(e)+1,r=new Array(i),o=J(e,r,0,r.length);return t&&(r.length=o),r}b||le.push({func:function(){si();}});var ti={p:function(e,t,s,i){ge("Assertion failed: "+K(e)+", at: "+[t?K(t):"unknown filename",s,i?K(i):"unknown function"]);},H:function(e){return ii(e+He)+He},G:function(e,t,s){throw new Ve(e).init(t,s),e},ha:Ze,ia:Qe,na:function(e){var t=qe[e];delete qe[e];var s=t.elements,i=s.length,r=s.map((function(e){return e.getterReturnType})).concat(s.map((function(e){return e.setterArgumentType}))),o=t.rawConstructor,n=t.rawDestructor;lt([e],r,(function(e){return s.forEach((function(t,s){var r=e[s],o=t.getter,n=t.getterContext,a=e[s+i],h=t.setter,l=t.setterContext;t.read=function(e){return r.fromWireType(o(n,e))},t.write=function(e,t){var s=[];h(l,e,a.toWireType(s,t)),$e(s);};})),[{name:t.name,fromWireType:function(e){for(var t=new Array(i),r=0;r<i;++r)t[r]=s[r].read(e);return n(e),t},toWireType:function(e,r){if(i!==r.length)throw new TypeError("Incorrect number of tuple elements for "+t.name+": expected="+i+", actual="+r.length);for(var a=o(),h=0;h<i;++h)s[h].write(a,r[h]);return null!==e&&e.push(n,a),a},argPackAdvance:8,readValueFromPointer:et,destructorFunction:n}]}));},w:function(e){var t=ut[e];delete ut[e];var s=t.rawConstructor,i=t.rawDestructor,r=t.fields;lt([e],r.map((function(e){return e.getterReturnType})).concat(r.map((function(e){return e.setterArgumentType}))),(function(e){var o={};return r.forEach((function(t,s){var i=t.fieldName,n=e[s],a=t.getter,h=t.getterContext,l=e[s+r.length],u=t.setter,c=t.setterContext;o[i]={read:function(e){return n.fromWireType(a(h,e))},write:function(e,t){var s=[];u(c,e,l.toWireType(s,t)),$e(s);}};})),[{name:t.name,fromWireType:function(e){var t={};for(var s in o)t[s]=o[s].read(e);return i(e),t},toWireType:function(e,t){for(var r in o)if(!(r in t))throw new TypeError('Missing field:  "'+r+'"');var n=s();for(r in o)o[r].write(n,t[r]);return null!==e&&e.push(i,n),n},argPackAdvance:8,readValueFromPointer:et,destructorFunction:i}]}));},ka:function(e,s,i,o,a){var h=ct(i);gt(e,{name:s=dt(s),fromWireType:function(e){return !!e},toWireType:function(e,t){return t?o:a},argPackAdvance:8,readValueFromPointer:function(e){var o;if(1===i)o=t();else if(2===i)o=r();else {if(4!==i)throw new TypeError("Unknown boolean type size: "+s);o=n();}return this.fromWireType(o[e>>>h])},destructorFunction:null});},z:function(e,t,s,i,r,o,n,a,h,l,u,c,p){u=dt(u),o=$t(r,o),a&&(a=$t(n,a)),l&&(l=$t(h,l)),p=$t(c,p);var d=rt(u);Rt(d,(function(){ss("Cannot construct "+u+" due to unbound types",[i]);})),lt([e,t,s],i?[i]:[],(function(t){var s,r;t=t[0],r=i?(s=t.registeredClass).instancePrototype:Bt.prototype;var n=ot(d,(function(){if(Object.getPrototypeOf(this)!==h)throw new ft("Use 'new' to construct "+u);if(void 0===c.constructor_body)throw new ft(u+" has no accessible constructor");var e=c.constructor_body[arguments.length];if(void 0===e)throw new ft("Tried to invoke ctor of "+u+" with invalid number of parameters ("+arguments.length+") - expected ("+Object.keys(c.constructor_body).toString()+") parameters instead!");return e.apply(this,arguments)})),h=Object.create(r,{constructor:{value:n}});n.prototype=h;var c=new Ot(u,n,h,p,s,o,a,l),f=new Qt(u,c,!0,!1,!1),m=new Qt(u+"*",c,!1,!1,!1),g=new Qt(u+" const*",c,!1,!0,!1);return Et[e]={pointerType:m,constPointerType:g},qt(d,n),[f,m,g]}));},y:function(e,t,s,i,r,o){X(t>0);var n=is(t,s);r=$t(i,r);var a=[o],h=[];lt([],[e],(function(e){var s="constructor "+(e=e[0]).name;if(void 0===e.registeredClass.constructor_body&&(e.registeredClass.constructor_body=[]),void 0!==e.registeredClass.constructor_body[t-1])throw new ft("Cannot register multiple constructors with identical number of parameters ("+(t-1)+") for class '"+e.name+"'! Overload resolution is currently only performed using the parameter count, not actual type info!");return e.registeredClass.constructor_body[t-1]=function(){ss("Cannot construct "+e.name+" due to unbound types",n);},lt([],n,(function(i){return e.registeredClass.constructor_body[t-1]=function(){arguments.length!==t-1&&mt(s+" called with "+arguments.length+" arguments, expected "+(t-1)),h.length=0,a.length=t;for(var e=1;e<t;++e)a[e]=i[e].toWireType(h,arguments[e-1]);var o=r.apply(null,a);return $e(h),i[0].fromWireType(o)},[]})),[]}));},e:function(e,t,s,i,r,o,n,a){var h=is(s,i);t=dt(t),o=$t(r,o),lt([],[e],(function(e){var i=(e=e[0]).name+"."+t;function r(){ss("Cannot call "+i+" due to unbound types",h);}a&&e.registeredClass.pureVirtualFunctions.push(t);var l=e.registeredClass.instancePrototype,u=l[t];return void 0===u||void 0===u.overloadTable&&u.className!==e.name&&u.argCount===s-2?(r.argCount=s-2,r.className=e.name,l[t]=r):(St(l,t,i),l[t].overloadTable[s-2]=r),lt([],h,(function(r){var a=rs(i,r,e,o,n);return void 0===l[t].overloadTable?(a.argCount=s-2,l[t]=a):l[t].overloadTable[s-2]=a,[]})),[]}));},ja:function(e,t){gt(e,{name:t=dt(t),fromWireType:function(e){var t=ns[e].value;return as(e),t},toWireType:function(e,t){return us(t)},argPackAdvance:8,readValueFromPointer:et,destructorFunction:null});},ma:function(e,t,s,i){var r=ct(s);function o(){}t=dt(t),o.values={},gt(e,{name:t,constructor:o,fromWireType:function(e){return this.constructor.values[e]},toWireType:function(e,t){return t.value},argPackAdvance:8,readValueFromPointer:cs(t,r,i),destructorFunction:null}),Rt(t,o);},E:function(e,t,s){var i=ps(e,"enum");t=dt(t);var r=i.constructor,o=Object.create(i.constructor.prototype,{value:{value:s},constructor:{value:ot(i.name+"_"+t,(function(){}))}});r.values[s]=o,r[t]=o;},N:function(e,t,s){var i=ct(s);gt(e,{name:t=dt(t),fromWireType:function(e){return e},toWireType:function(e,t){if("number"!=typeof t&&"boolean"!=typeof t)throw new TypeError('Cannot convert "'+ds(t)+'" to '+this.name);return t},argPackAdvance:8,readValueFromPointer:fs(t,i),destructorFunction:null});},i:function(e,t,s,i,r,o){var n=is(t,s);e=dt(e),r=$t(i,r),Rt(e,(function(){ss("Cannot call "+e+" due to unbound types",n);}),t-1),lt([],n,(function(s){var i=[s[0],null].concat(s.slice(1));return qt(e,rs(e,i,null,r,o),t-1),[]}));},u:function(e,t,s,i,r){t=dt(t),-1===r&&(r=4294967295);var o=ct(s),n=function(e){return e};if(0===i){var a=32-8*s;n=function(e){return e<<a>>>a};}var h=-1!=t.indexOf("unsigned");gt(e,{name:t,fromWireType:n,toWireType:function(e,s){if("number"!=typeof s&&"boolean"!=typeof s)throw new TypeError('Cannot convert "'+ds(s)+'" to '+this.name);if(s<i||s>r)throw new TypeError('Passing a number "'+ds(s)+'" from JS side to C/C++ side to an argument of type "'+t+'", which is outside the valid range ['+i+", "+r+"]!");return h?s>>>0:0|s},argPackAdvance:8,readValueFromPointer:ms(t,o,0!==i),destructorFunction:null});},q:function(e,t,s){var i=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array][t];function r(e){e>>=2;var t=a(),s=t[e>>>0],r=t[e+1>>>0];return new i(O,r,s)}gt(e,{name:s=dt(s),fromWireType:r,argPackAdvance:8,readValueFromPointer:r},{ignoreDuplicateRegistrations:!0});},O:function(e,t){var s="std::string"===(t=dt(t));gt(e,{name:t,fromWireType:function(e){var t,r=a()[e>>2];if(s)for(var o=e+4,n=0;n<=r;++n){var h=e+4+n;if(n==r||0==i()[h]){var l=K(o,h-o);void 0===t?t=l:(t+=String.fromCharCode(0),t+=l),o=h+1;}}else {var u=new Array(r);for(n=0;n<r;++n)u[n]=String.fromCharCode(i()[e+4+n]);t=u.join("");}return ri(e),t},toWireType:function(e,t){t instanceof ArrayBuffer&&(t=new Uint8Array(t));var r="string"==typeof t;r||t instanceof Uint8Array||t instanceof Uint8ClampedArray||t instanceof Int8Array||mt("Cannot pass non-string to std::string");var o=(s&&r?function(){return Q(t)}:function(){return t.length})(),n=ii(4+o+1);if(n>>>=0,a()[n>>2]=o,s&&r)Z(t,n+4,o+1);else if(r)for(var h=0;h<o;++h){var l=t.charCodeAt(h);l>255&&(ri(n),mt("String has UTF-16 code units that do not fit in 8 bits")),i()[n+4+h]=l;}else for(h=0;h<o;++h)i()[n+4+h]=t[h];return null!==e&&e.push(ri,n),n},argPackAdvance:8,readValueFromPointer:et,destructorFunction:function(e){ri(e);}});},F:function(e,t,s){var i,r,n,h,l;s=dt(s),2===t?(i=q,r=$,h=ee,n=function(){return o()},l=1):4===t&&(i=te,r=se,h=ie,n=function(){return a()},l=2),gt(e,{name:s,fromWireType:function(e){for(var s,r=a()[e>>2],o=n(),h=e+4,u=0;u<=r;++u){var c=e+4+u*t;if(u==r||0==o[c>>>l]){var p=i(h,c-h);void 0===s?s=p:(s+=String.fromCharCode(0),s+=p),h=c+t;}}return ri(e),s},toWireType:function(e,i){"string"!=typeof i&&mt("Cannot pass non-string to C++ string type "+s);var o=h(i),n=ii(4+o+t);return n>>>=0,a()[n>>2]=o>>l,r(i,n+4,o+t),null!==e&&e.push(ri,n),n},argPackAdvance:8,readValueFromPointer:et,destructorFunction:function(e){ri(e);}});},oa:function(e,t,s,i,r,o){qe[e]={name:dt(t),rawConstructor:$t(s,i),rawDestructor:$t(r,o),elements:[]};},l:function(e,t,s,i,r,o,n,a,h){qe[e].elements.push({getterReturnType:t,getter:$t(s,i),getterContext:r,setterArgumentType:o,setter:$t(n,a),setterContext:h});},x:function(e,t,s,i,r,o){ut[e]={name:dt(t),rawConstructor:$t(s,i),rawDestructor:$t(r,o),fields:[]};},h:function(e,t,s,i,r,o,n,a,h,l){ut[e].fields.push({fieldName:dt(t),getterReturnType:s,getter:$t(i,r),getterContext:o,setterArgumentType:n,setter:$t(a,h),setterContext:l});},la:function(e,t){gt(e,{isVoid:!0,name:t=dt(t),argPackAdvance:0,fromWireType:function(){},toWireType:function(e,t){}});},$:function(e,t){if(e==t)postMessage({cmd:"processQueuedMainThreadWork"});else if(b)postMessage({targetThread:e,cmd:"processThreadQueue"});else {var s=Oe.pthreads[e],i=s&&s.worker;if(!i)return;i.postMessage({cmd:"processThreadQueue"});}return 1},s:function(e,t,s){e=gs(e),t=ps(t,"emval::as");var i=[],r=us(i);return n()[s>>2]=r,t.toWireType(i,e)},P:function(e,t,s,i){e=gs(e);for(var r=function(e,t){for(var s=new Array(e),i=0;i<e;++i)s[i]=ps(n()[(t>>2)+i],"parameter "+i);return s}(t,s),o=new Array(t),a=0;a<t;++a){var h=r[a];o[a]=h.readValueFromPointer(i),i+=h.argPackAdvance;}return us(e.apply(void 0,o))},b:as,Z:function(e){return 0===e?us(vs()):(e=ys(e),us(vs()[e]))},t:function(e,t){return us((e=gs(e))[t=gs(t)])},o:function(e){e>4&&(ns[e].refcount+=1);},ba:function(e,t){return (e=gs(e))instanceof(t=gs(t))},Q:function(e){return "number"==typeof(e=gs(e))},I:function(){return us([])},j:function(e){return us(ys(e))},A:function(){return us({})},r:function(e){$e(ns[e].value),as(e);},m:function(e,t,s){e=gs(e),t=gs(t),s=gs(s),e[t]=s;},g:function(e,t){return us((e=ps(e,"_emval_take_value")).readValueFromPointer(t))},K:function(){ge();},fa:function(e,t){var s,i;if(0===e)s=Date.now();else {if(1!==e&&4!==e)return i=28,n()[ni()>>2]=i,-1;s=Re();}return n()[t>>2]=s/1e3|0,n()[t+4>>2]=s%1e3*1e3*1e3|0,0},B:function(e,t,s){var r=function(e,t){var s;for(Ps.length=0,t>>=2;s=i()[e++];){var r=s<105;r&&1&t&&t++,Ps.push(r?h()[t++>>1]:n()[t]),++t;}return Ps}(t,s);return xe[e].apply(null,r)},aa:function(){g||m||R("Blocking on the main thread is very dangerous, see https://emscripten.org/docs/porting/pthreads.html#blocking-on-the-main-browser-thread");},J:function(e,t){},k:function(e,s,i){if(e<=0||e>t().length||!0&e)return -28;if(f){if(Atomics.load(n(),e>>2)!=s)return -6;var r=performance.now(),o=r+i;for(Atomics.exchange(n(),Oe.mainThreadFutex>>2,e);;){if((r=performance.now())>o)return Atomics.exchange(n(),Oe.mainThreadFutex>>2,0),-73;if(0==Atomics.exchange(n(),Oe.mainThreadFutex>>2,0))break;if(fi(),Atomics.load(n(),e>>2)!=s)return -6;Atomics.exchange(n(),Oe.mainThreadFutex>>2,e);}return 0}var a=Atomics.wait(n(),e>>2,s,i);if("timed-out"===a)return -73;if("not-equal"===a)return -6;if("ok"===a)return 0;throw "Atomics.wait returned an unexpected value "+a},n:Se,d:Re,D:function(){return 0|Ie},C:function(){return 0|Ce},U:function(e,t,s){i().copyWithin(e,t,t+s);},W:function(e,t,s){ws.length=t;for(var i=s>>3,r=0;r<t;r++)ws[r]=h()[i+r];return (e<0?xe[-e-1]:$s[e]).apply(null,ws)},v:function(e){e>>>=0;var t=i().length;if(e<=t)return !1;var s=4294967296;if(e>s)return !1;for(var r=1;r<=4;r*=2){var o=t*(1+.2/r);if(o=Math.min(o,e+100663296),Ts(Math.min(s,re(Math.max(16777216,e,o),65536))))return !0}return !1},X:function(e,t,s){return Cs(e)?Is(e,t,s):Fs(e,t,s)},f:function(e){},Y:function(e,t){return function(e,t){var s=t>>2,i=n()[s+6],r={alpha:!!n()[s+0],depth:!!n()[s+1],stencil:!!n()[s+2],antialias:!!n()[s+3],premultipliedAlpha:!!n()[s+4],preserveDrawingBuffer:!!n()[s+5],powerPreference:Es[i],failIfMajorPerformanceCaveat:!!n()[s+7],majorVersion:n()[s+8],minorVersion:n()[s+9],enableExtensionsByDefault:n()[s+10],explicitSwapControl:n()[s+11],proxyContextToMainThread:n()[s+12],renderViaOffscreenBackBuffer:n()[s+13]},o=Cs(e);return o?r.explicitSwapControl?0:Bs.createContext(o,r):0}(e,t)},da:Os,ea:Ls,M:Ns,ga:ks,R:js,L:Gs,T:function(){Oe.initRuntime();},a:F||c.wasmMemory,V:function(e,t){Oe.threadExitHandlers.push((function(){ne.get(e)(t);}));},_:function(e,t,s,i){if("undefined"==typeof SharedArrayBuffer)return S("Current environment does not support SharedArrayBuffer, pthreads are not available!"),6;if(!e)return S("pthread_create called with a null thread pointer!"),28;var r=[];if(b&&0===r.length)return _i(687865856,e,t,s,i);var o=0,h=0,l=0,u=0,c=0;if(t)if(o=n()[t>>2],o+=81920,h=n()[t+8>>2],l=0!==n()[t+12>>2],0===n()[t+16>>2]){var p=n()[t+20>>2],d=n()[t+24>>2];!function(e,t,s){if(!t&&!s)return Ee;if(!e)return S("pthread_getschedparam called with a null thread pointer!"),Be;if(n()[e+12>>2]!==e)return S("pthread_getschedparam attempted on thread "+e+", which does not point to a valid thread, or does not exist anymore!"),Be;var i=Atomics.load(a(),e+108+20>>2),r=Atomics.load(a(),e+108+24>>2);t&&(n()[t>>2]=i),s&&(n()[s>>2]=r);}(Oe.currentProxiedOperationCallerThread?Oe.currentProxiedOperationCallerThread:Vs(),t+20,t+24),u=n()[t+20>>2],c=n()[t+24>>2],n()[t+20>>2]=p,n()[t+24>>2]=d;}else u=n()[t+20>>2],c=n()[t+24>>2];else o=2097152;var f=0==h;f?h=pi(16,o):X((h-=o)>0);for(var m=ii(232),g=0;g<58;++g)a()[(m>>2)+g]=0;n()[e>>2]=m,n()[m+12>>2]=m;var _=m+156;n()[_>>2]=_;var y={stackBase:h,stackSize:o,allocatedOwnStack:f,schedPolicy:u,schedPrio:c,detached:l,startRoutine:s,pthread_ptr:m,parent_pthread_ptr:Vs(),arg:i,transferList:r};return b?(y.cmd="spawnThread",postMessage(y,r)):Hs(y),0},c:Vs,S:function(e){},ca:function(e,t,s,i){return Ks(e,t,s,i)}};!function(){var e={a:ti};function t(e,t){var s=e.exports;if(c.asm=s,ne=c.asm.pa,B=t,!b){var i=Oe.unusedWorkers.length;Oe.unusedWorkers.forEach((function(e){Oe.loadWasmModuleToWorker(e,(function(){--i||me();}));}));}}function s(e){t(e.instance,e.module);}function i(t){return (C||!f&&!m||"function"!=typeof fetch||ve(Pe)?Promise.resolve().then(Te):fetch(Pe,{credentials:"same-origin"}).then((function(e){if(!e.ok)throw "failed to load wasm binary file at '"+Pe+"'";return e.arrayBuffer()})).catch((function(){return Te()}))).then((function(t){return WebAssembly.instantiate(t,e)})).then(t,(function(e){S("failed to asynchronously prepare wasm: "+e),ge(e);}))}if(b||fe(),c.instantiateWasm)try{return c.instantiateWasm(e,t)}catch(e){return S("Module.instantiateWasm callback failed with error: "+e),!1}(C||"function"!=typeof WebAssembly.instantiateStreaming||ye(Pe)||ve(Pe)||"function"!=typeof fetch?i(s):fetch(Pe,{credentials:"same-origin"}).then((function(t){return WebAssembly.instantiateStreaming(t,e).then(s,(function(e){return S("wasm streaming compile failed: "+e),S("falling back to ArrayBuffer instantiation"),i(s)}))}))).catch(u);}();var si=c.___wasm_call_ctors=function(){return (si=c.___wasm_call_ctors=c.asm.qa).apply(null,arguments)};c._main=function(){return (c._main=c.asm.ra).apply(null,arguments)};var ii=c._malloc=function(){return (ii=c._malloc=c.asm.sa).apply(null,arguments)},ri=c._free=function(){return (ri=c._free=c.asm.ta).apply(null,arguments)},oi=c.___getTypeName=function(){return (oi=c.___getTypeName=c.asm.ua).apply(null,arguments)};c.___embind_register_native_and_builtin_types=function(){return (c.___embind_register_native_and_builtin_types=c.asm.va).apply(null,arguments)};var ni=c.___errno_location=function(){return (ni=c.___errno_location=c.asm.wa).apply(null,arguments)},ai=c._emscripten_get_global_libc=function(){return (ai=c._emscripten_get_global_libc=c.asm.xa).apply(null,arguments)};c.___em_js__initPthreadsJS=function(){return (c.___em_js__initPthreadsJS=c.asm.ya).apply(null,arguments)};var hi=c.stackSave=function(){return (hi=c.stackSave=c.asm.za).apply(null,arguments)},li=c.stackRestore=function(){return (li=c.stackRestore=c.asm.Aa).apply(null,arguments)},ui=c.stackAlloc=function(){return (ui=c.stackAlloc=c.asm.Ba).apply(null,arguments)},ci=c._emscripten_stack_set_limits=function(){return (ci=c._emscripten_stack_set_limits=c.asm.Ca).apply(null,arguments)},pi=c._memalign=function(){return (pi=c._memalign=c.asm.Da).apply(null,arguments)};c._emscripten_main_browser_thread_id=function(){return (c._emscripten_main_browser_thread_id=c.asm.Ea).apply(null,arguments)};var di=c.___pthread_tsd_run_dtors=function(){return (di=c.___pthread_tsd_run_dtors=c.asm.Fa).apply(null,arguments)},fi=c._emscripten_main_thread_process_queued_calls=function(){return (fi=c._emscripten_main_thread_process_queued_calls=c.asm.Ga).apply(null,arguments)};c._emscripten_current_thread_process_queued_calls=function(){return (c._emscripten_current_thread_process_queued_calls=c.asm.Ha).apply(null,arguments)};var mi=c._emscripten_register_main_browser_thread_id=function(){return (mi=c._emscripten_register_main_browser_thread_id=c.asm.Ia).apply(null,arguments)},gi=c._do_emscripten_dispatch_to_thread=function(){return (gi=c._do_emscripten_dispatch_to_thread=c.asm.Ja).apply(null,arguments)};c._emscripten_async_run_in_main_thread=function(){return (c._emscripten_async_run_in_main_thread=c.asm.Ka).apply(null,arguments)},c._emscripten_sync_run_in_main_thread=function(){return (c._emscripten_sync_run_in_main_thread=c.asm.La).apply(null,arguments)},c._emscripten_sync_run_in_main_thread_0=function(){return (c._emscripten_sync_run_in_main_thread_0=c.asm.Ma).apply(null,arguments)},c._emscripten_sync_run_in_main_thread_1=function(){return (c._emscripten_sync_run_in_main_thread_1=c.asm.Na).apply(null,arguments)},c._emscripten_sync_run_in_main_thread_2=function(){return (c._emscripten_sync_run_in_main_thread_2=c.asm.Oa).apply(null,arguments)},c._emscripten_sync_run_in_main_thread_xprintf_varargs=function(){return (c._emscripten_sync_run_in_main_thread_xprintf_varargs=c.asm.Pa).apply(null,arguments)},c._emscripten_sync_run_in_main_thread_3=function(){return (c._emscripten_sync_run_in_main_thread_3=c.asm.Qa).apply(null,arguments)};var _i=c._emscripten_sync_run_in_main_thread_4=function(){return (_i=c._emscripten_sync_run_in_main_thread_4=c.asm.Ra).apply(null,arguments)};c._emscripten_sync_run_in_main_thread_5=function(){return (c._emscripten_sync_run_in_main_thread_5=c.asm.Sa).apply(null,arguments)},c._emscripten_sync_run_in_main_thread_6=function(){return (c._emscripten_sync_run_in_main_thread_6=c.asm.Ta).apply(null,arguments)},c._emscripten_sync_run_in_main_thread_7=function(){return (c._emscripten_sync_run_in_main_thread_7=c.asm.Ua).apply(null,arguments)};var yi=c._emscripten_run_in_main_runtime_thread_js=function(){return (yi=c._emscripten_run_in_main_runtime_thread_js=c.asm.Va).apply(null,arguments)},vi=c.__emscripten_call_on_thread=function(){return (vi=c.__emscripten_call_on_thread=c.asm.Wa).apply(null,arguments)};c._emscripten_tls_init=function(){return (c._emscripten_tls_init=c.asm.Xa).apply(null,arguments)},c.dynCall_jiji=function(){return (c.dynCall_jiji=c.asm.Ya).apply(null,arguments)},c.dynCall_viijii=function(){return (c.dynCall_viijii=c.asm.Za).apply(null,arguments)},c.dynCall_iiiiiijj=function(){return (c.dynCall_iiiiiijj=c.asm._a).apply(null,arguments)},c.dynCall_iiiiij=function(){return (c.dynCall_iiiiij=c.asm.$a).apply(null,arguments)},c.dynCall_iiiiijj=function(){return (c.dynCall_iiiiijj=c.asm.ab).apply(null,arguments)};var bi,wi=c._main_thread_futex=51928;function Pi(e){this.name="ExitStatus",this.message="Program terminated with exit("+e+")",this.status=e;}function Ti(e){var t,s=c._main;try{t=s(0,0),!0&&I&&0===t||(I||(Oe.terminateAllThreads(),c.onExit&&c.onExit(t),W=!0),v(t,new Pi(t)));}catch(e){if(e instanceof Pi)return;if("unwind"==e)return void(I=!0);var i=e;e&&"object"==typeof e&&e.stack&&(i=[e,e.stack]),S("exception thrown: "+i),v(1,e);}}function xi(e){function t(){bi||(bi=!0,c.calledRun=!0,W||(c.noFSInit||Ke.init.initialized||Ke.init(),Me(le),b||(Ke.ignorePermissions=!1,Me(ue)),l(c),c.onRuntimeInitialized&&c.onRuntimeInitialized(),Mi&&Ti(),function(){if(!b){if(c.postRun)for("function"==typeof c.postRun&&(c.postRun=[c.postRun]);c.postRun.length;)e=c.postRun.shift(),ce.unshift(e);var e;Me(ce);}}()));}pe>0||(function(){if(!b){if(c.preRun)for("function"==typeof c.preRun&&(c.preRun=[c.preRun]);c.preRun.length;)e=c.preRun.shift(),he.unshift(e);var e;Me(he);}}(),pe>0||(c.setStatus?(c.setStatus("Running..."),setTimeout((function(){setTimeout((function(){c.setStatus("");}),1),t();}),1)):t()));}if(c.addRunDependency=fe,c.removeRunDependency=me,c.FS_createPath=Ke.createPath,c.FS_createDataFile=Ke.createDataFile,c.FS_createPreloadedFile=Ke.createPreloadedFile,c.FS_createLazyFile=Ke.createLazyFile,c.FS_createDevice=Ke.createDevice,c.FS_unlink=Ke.unlink,c.FS=Ke,c.PThread=Oe,c.PThread=Oe,c._pthread_self=Vs,c.wasmMemory=F,c.ExitStatus=Pi,de=function e(){bi||xi(),bi||(de=e);},c.run=xi,c.preInit)for("function"==typeof c.preInit&&(c.preInit=[c.preInit]);c.preInit.length>0;)c.preInit.pop()();var Mi=!0;return c.noInitialRun&&(Mi=!1),b||(I=!0),b?Oe.initWorker():xi(),e.ready});"object"==typeof e&&"object"==typeof t?t.exports=i:"function"==typeof define&&define.amd?define([],(function(){return i})):"object"==typeof e&&(e.WebIFCWasm=i);}}),D_=P_({"dist/web-ifc.js"(e,t){var s,i=(s="undefined"!=typeof document&&document.currentScript?document.currentScript.src:void 0,"undefined"!=typeof __filename&&(s=s||__filename),function(e){var t,i,r=void 0!==(e=e||{})?e:{};r.ready=new Promise((function(e,s){t=e,i=s;}));var o,n={};for(o in r)r.hasOwnProperty(o)&&(n[o]=r[o]);var a,h,l,u,c="./this.program",p=function(e,t){throw t};a="object"==typeof window,h="function"==typeof importScripts,l="object"==typeof process&&"object"==typeof process.versions&&"string"==typeof process.versions.node,u=!a&&!l&&!h;var d,f,m,g,_="";l?(_=h?w_("path").dirname(_)+"/":__dirname+"/",d=function(e,t){return m||(m=w_("fs")),g||(g=w_("path")),e=g.normalize(e),m.readFileSync(e,t?null:"utf8")},f=function(e){var t=d(e,!0);return t.buffer||(t=new Uint8Array(t)),x(t.buffer),t},process.argv.length>1&&(c=process.argv[1].replace(/\\/g,"/")),process.argv.slice(2),process.on("uncaughtException",(function(e){if(!(e instanceof ys))throw e})),process.on("unhandledRejection",oe),p=function(e){process.exit(e);},r.inspect=function(){return "[Emscripten Module object]"}):u?("undefined"!=typeof read&&(d=function(e){return read(e)}),f=function(e){var t;return "function"==typeof readbuffer?new Uint8Array(readbuffer(e)):(x("object"==typeof(t=read(e,"binary"))),t)},"undefined"!=typeof scriptArgs&&scriptArgs,"function"==typeof quit&&(p=function(e){quit(e);}),"undefined"!=typeof print&&("undefined"==typeof console&&(console={}),console.log=print,console.warn=console.error="undefined"!=typeof printErr?printErr:print)):(a||h)&&(h?_=self.location.href:"undefined"!=typeof document&&document.currentScript&&(_=document.currentScript.src),s&&(_=s),_=0!==_.indexOf("blob:")?_.substr(0,_.lastIndexOf("/")+1):"",d=function(e){var t=new XMLHttpRequest;return t.open("GET",e,!1),t.send(null),t.responseText},h&&(f=function(e){var t=new XMLHttpRequest;return t.open("GET",e,!1),t.responseType="arraybuffer",t.send(null),new Uint8Array(t.response)}));var y,v,b,w=r.print||console.log.bind(console),P=r.printErr||console.warn.bind(console);for(o in n)n.hasOwnProperty(o)&&(r[o]=n[o]);n=null,r.arguments,r.thisProgram&&(c=r.thisProgram),r.quit&&(p=r.quit),r.wasmBinary&&(y=r.wasmBinary),r.noExitRuntime&&(v=r.noExitRuntime),"object"!=typeof WebAssembly&&oe("no native wasm support detected");var T=!1;function x(e,t){e||oe("Assertion failed: "+t);}var M="undefined"!=typeof TextDecoder?new TextDecoder("utf8"):void 0;function D(e,t,s){for(var i=(t>>>=0)+s,r=t;e[r>>>0]&&!(r>=i);)++r;if(r-t>16&&e.subarray&&M)return M.decode(e.subarray(t>>>0,r>>>0));for(var o="";t<r;){var n=e[t++>>>0];if(128&n){var a=63&e[t++>>>0];if(192!=(224&n)){var h=63&e[t++>>>0];if((n=224==(240&n)?(15&n)<<12|a<<6|h:(7&n)<<18|a<<12|h<<6|63&e[t++>>>0])<65536)o+=String.fromCharCode(n);else {var l=n-65536;o+=String.fromCharCode(55296|l>>10,56320|1023&l);}}else o+=String.fromCharCode((31&n)<<6|a);}else o+=String.fromCharCode(n);}return o}function A(e,t){return (e>>>=0)?D(S,e,t):""}function C(e,t,s,i){if(!(i>0))return 0;for(var r=s>>>=0,o=s+i-1,n=0;n<e.length;++n){var a=e.charCodeAt(n);if(a>=55296&&a<=57343&&(a=65536+((1023&a)<<10)|1023&e.charCodeAt(++n)),a<=127){if(s>=o)break;t[s++>>>0]=a;}else if(a<=2047){if(s+1>=o)break;t[s++>>>0]=192|a>>6,t[s++>>>0]=128|63&a;}else if(a<=65535){if(s+2>=o)break;t[s++>>>0]=224|a>>12,t[s++>>>0]=128|a>>6&63,t[s++>>>0]=128|63&a;}else {if(s+3>=o)break;t[s++>>>0]=240|a>>18,t[s++>>>0]=128|a>>12&63,t[s++>>>0]=128|a>>6&63,t[s++>>>0]=128|63&a;}}return t[s>>>0]=0,s-r}function I(e,t,s){return C(e,S,t,s)}function F(e){for(var t=0,s=0;s<e.length;++s){var i=e.charCodeAt(s);i>=55296&&i<=57343&&(i=65536+((1023&i)<<10)|1023&e.charCodeAt(++s)),i<=127?++t:t+=i<=2047?2:i<=65535?3:4;}return t}var B,E,S,R,O,L,N,k,j,G="undefined"!=typeof TextDecoder?new TextDecoder("utf-16le"):void 0;function H(e,t){for(var s=e,i=s>>1,r=i+t/2;!(i>=r)&&O[i>>>0];)++i;if((s=i<<1)-e>32&&G)return G.decode(S.subarray(e>>>0,s>>>0));for(var o="",n=0;!(n>=t/2);++n){var a=R[e+2*n>>>1];if(0==a)break;o+=String.fromCharCode(a);}return o}function V(e,t,s){if(void 0===s&&(s=2147483647),s<2)return 0;for(var i=t,r=(s-=2)<2*e.length?s/2:e.length,o=0;o<r;++o){var n=e.charCodeAt(o);R[t>>>1]=n,t+=2;}return R[t>>>1]=0,t-i}function U(e){return 2*e.length}function z(e,t){for(var s=0,i="";!(s>=t/4);){var r=L[e+4*s>>>2];if(0==r)break;if(++s,r>=65536){var o=r-65536;i+=String.fromCharCode(55296|o>>10,56320|1023&o);}else i+=String.fromCharCode(r);}return i}function W(e,t,s){if(void 0===s&&(s=2147483647),s<4)return 0;for(var i=t>>>=0,r=i+s-4,o=0;o<e.length;++o){var n=e.charCodeAt(o);if(n>=55296&&n<=57343&&(n=65536+((1023&n)<<10)|1023&e.charCodeAt(++o)),L[t>>>2]=n,(t+=4)+4>r)break}return L[t>>>2]=0,t-i}function X(e){for(var t=0,s=0;s<e.length;++s){var i=e.charCodeAt(s);i>=55296&&i<=57343&&++s,t+=4;}return t}function Y(e,t){return e%t>0&&(e+=t-e%t),e}function K(e){B=e,r.HEAP8=E=new Int8Array(e),r.HEAP16=R=new Int16Array(e),r.HEAP32=L=new Int32Array(e),r.HEAPU8=S=new Uint8Array(e),r.HEAPU16=O=new Uint16Array(e),r.HEAPU32=N=new Uint32Array(e),r.HEAPF32=k=new Float32Array(e),r.HEAPF64=j=new Float64Array(e);}var J,Z=r.INITIAL_MEMORY||16777216;(b=r.wasmMemory?r.wasmMemory:new WebAssembly.Memory({initial:Z/65536,maximum:65536}))&&(B=b.buffer),Z=B.byteLength,K(B);var Q=[],q=[],$=[],ee=[],te=0,se=null;function ie(e){te++,r.monitorRunDependencies&&r.monitorRunDependencies(te);}function re(e){if(te--,r.monitorRunDependencies&&r.monitorRunDependencies(te),0==te&&se){var t=se;se=null,t();}}function oe(e){r.onAbort&&r.onAbort(e),P(e+=""),T=!0,e="abort("+e+"). Build with -s ASSERTIONS=1 for more info.";var t=new WebAssembly.RuntimeError(e);throw i(t),t}function ne(e,t){return String.prototype.startsWith?e.startsWith(t):0===e.indexOf(t)}function ae(e){return ne(e,"data:application/octet-stream;base64,")}function he(e){return ne(e,"file://")}r.preloadedImages={},r.preloadedAudios={};var le,ue,ce="web-ifc.wasm";function pe(){try{if(y)return new Uint8Array(y);if(f)return f(ce);throw "both async and sync fetching of the wasm failed"}catch(e){oe(e);}}function de(e){for(;e.length>0;){var t=e.shift();if("function"!=typeof t){var s=t.func;"number"==typeof s?void 0===t.arg?J.get(s)():J.get(s)(t.arg):s(void 0===t.arg?null:t.arg);}else t(r);}}function fe(e,t,s){return -1!=e.indexOf("j")?function(e,t,s){return s&&s.length?r["dynCall_"+e].apply(null,[t].concat(s)):r["dynCall_"+e].call(null,t)}(e,t,s):J.get(t).apply(null,s)}ae(ce)||(ce=function(e){return r.locateFile?r.locateFile(e,_):_+e}(ce));var me=0,ge=4,_e=8,ye=12,ve=13,be=16;function we(e){this.excPtr=e,this.ptr=e-be,this.set_type=function(e){L[this.ptr+_e>>>2]=e;},this.get_type=function(){return L[this.ptr+_e>>>2]},this.set_destructor=function(e){L[this.ptr+me>>>2]=e;},this.get_destructor=function(){return L[this.ptr+me>>>2]},this.set_refcount=function(e){L[this.ptr+ge>>>2]=e;},this.set_caught=function(e){e=e?1:0,E[this.ptr+ye>>>0]=e;},this.get_caught=function(){return 0!=E[this.ptr+ye>>>0]},this.set_rethrown=function(e){e=e?1:0,E[this.ptr+ve>>>0]=e;},this.get_rethrown=function(){return 0!=E[this.ptr+ve>>>0]},this.init=function(e,t){this.set_type(e),this.set_destructor(t),this.set_refcount(0),this.set_caught(!1),this.set_rethrown(!1);},this.add_ref=function(){var e=L[this.ptr+ge>>>2];L[this.ptr+ge>>>2]=e+1;},this.release_ref=function(){var e=L[this.ptr+ge>>>2];return L[this.ptr+ge>>>2]=e-1,1===e};}var Pe={splitPath:function(e){return /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(e).slice(1)},normalizeArray:function(e,t){for(var s=0,i=e.length-1;i>=0;i--){var r=e[i];"."===r?e.splice(i,1):".."===r?(e.splice(i,1),s++):s&&(e.splice(i,1),s--);}if(t)for(;s;s--)e.unshift("..");return e},normalize:function(e){var t="/"===e.charAt(0),s="/"===e.substr(-1);return e=Pe.normalizeArray(e.split("/").filter((function(e){return !!e})),!t).join("/"),e||t||(e="."),e&&s&&(e+="/"),(t?"/":"")+e},dirname:function(e){var t=Pe.splitPath(e),s=t[0],i=t[1];return s||i?(i&&(i=i.substr(0,i.length-1)),s+i):"."},basename:function(e){if("/"===e)return "/";var t=(e=(e=Pe.normalize(e)).replace(/\/$/,"")).lastIndexOf("/");return -1===t?e:e.substr(t+1)},extname:function(e){return Pe.splitPath(e)[3]},join:function(){var e=Array.prototype.slice.call(arguments,0);return Pe.normalize(e.join("/"))},join2:function(e,t){return Pe.normalize(e+"/"+t)}},Te={resolve:function(){for(var e="",t=!1,s=arguments.length-1;s>=-1&&!t;s--){var i=s>=0?arguments[s]:Ae.cwd();if("string"!=typeof i)throw new TypeError("Arguments to path.resolve must be strings");if(!i)return "";e=i+"/"+e,t="/"===i.charAt(0);}return e=Pe.normalizeArray(e.split("/").filter((function(e){return !!e})),!t).join("/"),(t?"/":"")+e||"."},relative:function(e,t){function s(e){for(var t=0;t<e.length&&""===e[t];t++);for(var s=e.length-1;s>=0&&""===e[s];s--);return t>s?[]:e.slice(t,s-t+1)}e=Te.resolve(e).substr(1),t=Te.resolve(t).substr(1);for(var i=s(e.split("/")),r=s(t.split("/")),o=Math.min(i.length,r.length),n=o,a=0;a<o;a++)if(i[a]!==r[a]){n=a;break}var h=[];for(a=n;a<i.length;a++)h.push("..");return (h=h.concat(r.slice(n))).join("/")}},xe={ttys:[],init:function(){},shutdown:function(){},register:function(e,t){xe.ttys[e]={input:[],output:[],ops:t},Ae.registerDevice(e,xe.stream_ops);},stream_ops:{open:function(e){var t=xe.ttys[e.node.rdev];if(!t)throw new Ae.ErrnoError(43);e.tty=t,e.seekable=!1;},close:function(e){e.tty.ops.flush(e.tty);},flush:function(e){e.tty.ops.flush(e.tty);},read:function(e,t,s,i,r){if(!e.tty||!e.tty.ops.get_char)throw new Ae.ErrnoError(60);for(var o=0,n=0;n<i;n++){var a;try{a=e.tty.ops.get_char(e.tty);}catch(e){throw new Ae.ErrnoError(29)}if(void 0===a&&0===o)throw new Ae.ErrnoError(6);if(null==a)break;o++,t[s+n]=a;}return o&&(e.node.timestamp=Date.now()),o},write:function(e,t,s,i,r){if(!e.tty||!e.tty.ops.put_char)throw new Ae.ErrnoError(60);try{for(var o=0;o<i;o++)e.tty.ops.put_char(e.tty,t[s+o]);}catch(e){throw new Ae.ErrnoError(29)}return i&&(e.node.timestamp=Date.now()),o}},default_tty_ops:{get_char:function(e){if(!e.input.length){var t=null;if(l){var s=Buffer.alloc?Buffer.alloc(256):new Buffer(256),i=0;try{i=m.readSync(process.stdin.fd,s,0,256,null);}catch(e){if(-1==e.toString().indexOf("EOF"))throw e;i=0;}t=i>0?s.slice(0,i).toString("utf-8"):null;}else "undefined"!=typeof window&&"function"==typeof window.prompt?null!==(t=window.prompt("Input: "))&&(t+="\n"):"function"==typeof readline&&null!==(t=readline())&&(t+="\n");if(!t)return null;e.input=us(t,!0);}return e.input.shift()},put_char:function(e,t){null===t||10===t?(w(D(e.output,0)),e.output=[]):0!=t&&e.output.push(t);},flush:function(e){e.output&&e.output.length>0&&(w(D(e.output,0)),e.output=[]);}},default_tty1_ops:{put_char:function(e,t){null===t||10===t?(P(D(e.output,0)),e.output=[]):0!=t&&e.output.push(t);},flush:function(e){e.output&&e.output.length>0&&(P(D(e.output,0)),e.output=[]);}}};function Me(e){for(var t=function(e,t){return t||(t=16),Math.ceil(e/t)*t}(e,16384),s=ds(t);e<t;)E[s+e++>>>0]=0;return s}var De={ops_table:null,mount:function(e){return De.createNode(null,"/",16895,0)},createNode:function(e,t,s,i){if(Ae.isBlkdev(s)||Ae.isFIFO(s))throw new Ae.ErrnoError(63);De.ops_table||(De.ops_table={dir:{node:{getattr:De.node_ops.getattr,setattr:De.node_ops.setattr,lookup:De.node_ops.lookup,mknod:De.node_ops.mknod,rename:De.node_ops.rename,unlink:De.node_ops.unlink,rmdir:De.node_ops.rmdir,readdir:De.node_ops.readdir,symlink:De.node_ops.symlink},stream:{llseek:De.stream_ops.llseek}},file:{node:{getattr:De.node_ops.getattr,setattr:De.node_ops.setattr},stream:{llseek:De.stream_ops.llseek,read:De.stream_ops.read,write:De.stream_ops.write,allocate:De.stream_ops.allocate,mmap:De.stream_ops.mmap,msync:De.stream_ops.msync}},link:{node:{getattr:De.node_ops.getattr,setattr:De.node_ops.setattr,readlink:De.node_ops.readlink},stream:{}},chrdev:{node:{getattr:De.node_ops.getattr,setattr:De.node_ops.setattr},stream:Ae.chrdev_stream_ops}});var r=Ae.createNode(e,t,s,i);return Ae.isDir(r.mode)?(r.node_ops=De.ops_table.dir.node,r.stream_ops=De.ops_table.dir.stream,r.contents={}):Ae.isFile(r.mode)?(r.node_ops=De.ops_table.file.node,r.stream_ops=De.ops_table.file.stream,r.usedBytes=0,r.contents=null):Ae.isLink(r.mode)?(r.node_ops=De.ops_table.link.node,r.stream_ops=De.ops_table.link.stream):Ae.isChrdev(r.mode)&&(r.node_ops=De.ops_table.chrdev.node,r.stream_ops=De.ops_table.chrdev.stream),r.timestamp=Date.now(),e&&(e.contents[t]=r),r},getFileDataAsRegularArray:function(e){if(e.contents&&e.contents.subarray){for(var t=[],s=0;s<e.usedBytes;++s)t.push(e.contents[s]);return t}return e.contents},getFileDataAsTypedArray:function(e){return e.contents?e.contents.subarray?e.contents.subarray(0,e.usedBytes):new Uint8Array(e.contents):new Uint8Array(0)},expandFileStorage:function(e,t){t>>>=0;var s=e.contents?e.contents.length:0;if(!(s>=t)){t=Math.max(t,s*(s<1048576?2:1.125)>>>0),0!=s&&(t=Math.max(t,256));var i=e.contents;e.contents=new Uint8Array(t),e.usedBytes>0&&e.contents.set(i.subarray(0,e.usedBytes),0);}},resizeFileStorage:function(e,t){if(t>>>=0,e.usedBytes!=t){if(0==t)return e.contents=null,void(e.usedBytes=0);if(!e.contents||e.contents.subarray){var s=e.contents;return e.contents=new Uint8Array(t),s&&e.contents.set(s.subarray(0,Math.min(t,e.usedBytes))),void(e.usedBytes=t)}if(e.contents||(e.contents=[]),e.contents.length>t)e.contents.length=t;else for(;e.contents.length<t;)e.contents.push(0);e.usedBytes=t;}},node_ops:{getattr:function(e){var t={};return t.dev=Ae.isChrdev(e.mode)?e.id:1,t.ino=e.id,t.mode=e.mode,t.nlink=1,t.uid=0,t.gid=0,t.rdev=e.rdev,Ae.isDir(e.mode)?t.size=4096:Ae.isFile(e.mode)?t.size=e.usedBytes:Ae.isLink(e.mode)?t.size=e.link.length:t.size=0,t.atime=new Date(e.timestamp),t.mtime=new Date(e.timestamp),t.ctime=new Date(e.timestamp),t.blksize=4096,t.blocks=Math.ceil(t.size/t.blksize),t},setattr:function(e,t){void 0!==t.mode&&(e.mode=t.mode),void 0!==t.timestamp&&(e.timestamp=t.timestamp),void 0!==t.size&&De.resizeFileStorage(e,t.size);},lookup:function(e,t){throw Ae.genericErrors[44]},mknod:function(e,t,s,i){return De.createNode(e,t,s,i)},rename:function(e,t,s){if(Ae.isDir(e.mode)){var i;try{i=Ae.lookupNode(t,s);}catch(e){}if(i)for(var r in i.contents)throw new Ae.ErrnoError(55)}delete e.parent.contents[e.name],e.name=s,t.contents[s]=e,e.parent=t;},unlink:function(e,t){delete e.contents[t];},rmdir:function(e,t){var s=Ae.lookupNode(e,t);for(var i in s.contents)throw new Ae.ErrnoError(55);delete e.contents[t];},readdir:function(e){var t=[".",".."];for(var s in e.contents)e.contents.hasOwnProperty(s)&&t.push(s);return t},symlink:function(e,t,s){var i=De.createNode(e,t,41471,0);return i.link=s,i},readlink:function(e){if(!Ae.isLink(e.mode))throw new Ae.ErrnoError(28);return e.link}},stream_ops:{read:function(e,t,s,i,r){var o=e.node.contents;if(r>=e.node.usedBytes)return 0;var n=Math.min(e.node.usedBytes-r,i);if(n>8&&o.subarray)t.set(o.subarray(r,r+n),s);else for(var a=0;a<n;a++)t[s+a]=o[r+a];return n},write:function(e,t,s,i,r,o){if(t.buffer===E.buffer&&(o=!1),!i)return 0;var n=e.node;if(n.timestamp=Date.now(),t.subarray&&(!n.contents||n.contents.subarray)){if(o)return n.contents=t.subarray(s,s+i),n.usedBytes=i,i;if(0===n.usedBytes&&0===r)return n.contents=t.slice(s,s+i),n.usedBytes=i,i;if(r+i<=n.usedBytes)return n.contents.set(t.subarray(s,s+i),r),i}if(De.expandFileStorage(n,r+i),n.contents.subarray&&t.subarray)n.contents.set(t.subarray(s,s+i),r);else for(var a=0;a<i;a++)n.contents[r+a]=t[s+a];return n.usedBytes=Math.max(n.usedBytes,r+i),i},llseek:function(e,t,s){var i=t;if(1===s?i+=e.position:2===s&&Ae.isFile(e.node.mode)&&(i+=e.node.usedBytes),i<0)throw new Ae.ErrnoError(28);return i},allocate:function(e,t,s){De.expandFileStorage(e.node,t+s),e.node.usedBytes=Math.max(e.node.usedBytes,t+s);},mmap:function(e,t,s,i,r,o){if(x(0===t),!Ae.isFile(e.node.mode))throw new Ae.ErrnoError(43);var n,a,h=e.node.contents;if(2&o||h.buffer!==B){if((i>0||i+s<h.length)&&(h=h.subarray?h.subarray(i,i+s):Array.prototype.slice.call(h,i,i+s)),a=!0,!(n=Me(s)))throw new Ae.ErrnoError(48);n>>>=0,E.set(h,n>>>0);}else a=!1,n=h.byteOffset;return {ptr:n,allocated:a}},msync:function(e,t,s,i,r){if(!Ae.isFile(e.node.mode))throw new Ae.ErrnoError(43);return 2&r||De.stream_ops.write(e,t,0,i,s,!1),0}}},Ae={root:null,mounts:[],devices:{},streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:!1,ignorePermissions:!0,trackingDelegate:{},tracking:{openFlags:{READ:1,WRITE:2}},ErrnoError:null,genericErrors:{},filesystems:null,syncFSRequests:0,lookupPath:function(e,t){if(t=t||{},!(e=Te.resolve(Ae.cwd(),e)))return {path:"",node:null};var s={follow_mount:!0,recurse_count:0};for(var i in s)void 0===t[i]&&(t[i]=s[i]);if(t.recurse_count>8)throw new Ae.ErrnoError(32);for(var r=Pe.normalizeArray(e.split("/").filter((function(e){return !!e})),!1),o=Ae.root,n="/",a=0;a<r.length;a++){var h=a===r.length-1;if(h&&t.parent)break;if(o=Ae.lookupNode(o,r[a]),n=Pe.join2(n,r[a]),Ae.isMountpoint(o)&&(!h||h&&t.follow_mount)&&(o=o.mounted.root),!h||t.follow)for(var l=0;Ae.isLink(o.mode);){var u=Ae.readlink(n);if(n=Te.resolve(Pe.dirname(n),u),o=Ae.lookupPath(n,{recurse_count:t.recurse_count}).node,l++>40)throw new Ae.ErrnoError(32)}}return {path:n,node:o}},getPath:function(e){for(var t;;){if(Ae.isRoot(e)){var s=e.mount.mountpoint;return t?"/"!==s[s.length-1]?s+"/"+t:s+t:s}t=t?e.name+"/"+t:e.name,e=e.parent;}},hashName:function(e,t){for(var s=0,i=0;i<t.length;i++)s=(s<<5)-s+t.charCodeAt(i)|0;return (e+s>>>0)%Ae.nameTable.length},hashAddNode:function(e){var t=Ae.hashName(e.parent.id,e.name);e.name_next=Ae.nameTable[t],Ae.nameTable[t]=e;},hashRemoveNode:function(e){var t=Ae.hashName(e.parent.id,e.name);if(Ae.nameTable[t]===e)Ae.nameTable[t]=e.name_next;else for(var s=Ae.nameTable[t];s;){if(s.name_next===e){s.name_next=e.name_next;break}s=s.name_next;}},lookupNode:function(e,t){var s=Ae.mayLookup(e);if(s)throw new Ae.ErrnoError(s,e);for(var i=Ae.hashName(e.id,t),r=Ae.nameTable[i];r;r=r.name_next){var o=r.name;if(r.parent.id===e.id&&o===t)return r}return Ae.lookup(e,t)},createNode:function(e,t,s,i){var r=new Ae.FSNode(e,t,s,i);return Ae.hashAddNode(r),r},destroyNode:function(e){Ae.hashRemoveNode(e);},isRoot:function(e){return e===e.parent},isMountpoint:function(e){return !!e.mounted},isFile:function(e){return 32768==(61440&e)},isDir:function(e){return 16384==(61440&e)},isLink:function(e){return 40960==(61440&e)},isChrdev:function(e){return 8192==(61440&e)},isBlkdev:function(e){return 24576==(61440&e)},isFIFO:function(e){return 4096==(61440&e)},isSocket:function(e){return 49152==(49152&e)},flagModes:{r:0,"r+":2,w:577,"w+":578,a:1089,"a+":1090},modeStringToFlags:function(e){var t=Ae.flagModes[e];if(void 0===t)throw new Error("Unknown file open mode: "+e);return t},flagsToPermissionString:function(e){var t=["r","w","rw"][3&e];return 512&e&&(t+="w"),t},nodePermissions:function(e,t){return Ae.ignorePermissions||(-1===t.indexOf("r")||292&e.mode)&&(-1===t.indexOf("w")||146&e.mode)&&(-1===t.indexOf("x")||73&e.mode)?0:2},mayLookup:function(e){var t=Ae.nodePermissions(e,"x");return t||(e.node_ops.lookup?0:2)},mayCreate:function(e,t){try{return Ae.lookupNode(e,t),20}catch(e){}return Ae.nodePermissions(e,"wx")},mayDelete:function(e,t,s){var i;try{i=Ae.lookupNode(e,t);}catch(e){return e.errno}var r=Ae.nodePermissions(e,"wx");if(r)return r;if(s){if(!Ae.isDir(i.mode))return 54;if(Ae.isRoot(i)||Ae.getPath(i)===Ae.cwd())return 10}else if(Ae.isDir(i.mode))return 31;return 0},mayOpen:function(e,t){return e?Ae.isLink(e.mode)?32:Ae.isDir(e.mode)&&("r"!==Ae.flagsToPermissionString(t)||512&t)?31:Ae.nodePermissions(e,Ae.flagsToPermissionString(t)):44},MAX_OPEN_FDS:4096,nextfd:function(e,t){e=e||0,t=t||Ae.MAX_OPEN_FDS;for(var s=e;s<=t;s++)if(!Ae.streams[s])return s;throw new Ae.ErrnoError(33)},getStream:function(e){return Ae.streams[e]},createStream:function(e,t,s){Ae.FSStream||(Ae.FSStream=function(){},Ae.FSStream.prototype={object:{get:function(){return this.node},set:function(e){this.node=e;}},isRead:{get:function(){return 1!=(2097155&this.flags)}},isWrite:{get:function(){return 0!=(2097155&this.flags)}},isAppend:{get:function(){return 1024&this.flags}}});var i=new Ae.FSStream;for(var r in e)i[r]=e[r];e=i;var o=Ae.nextfd(t,s);return e.fd=o,Ae.streams[o]=e,e},closeStream:function(e){Ae.streams[e]=null;},chrdev_stream_ops:{open:function(e){var t=Ae.getDevice(e.node.rdev);e.stream_ops=t.stream_ops,e.stream_ops.open&&e.stream_ops.open(e);},llseek:function(){throw new Ae.ErrnoError(70)}},major:function(e){return e>>8},minor:function(e){return 255&e},makedev:function(e,t){return e<<8|t},registerDevice:function(e,t){Ae.devices[e]={stream_ops:t};},getDevice:function(e){return Ae.devices[e]},getMounts:function(e){for(var t=[],s=[e];s.length;){var i=s.pop();t.push(i),s.push.apply(s,i.mounts);}return t},syncfs:function(e,t){"function"==typeof e&&(t=e,e=!1),Ae.syncFSRequests++,Ae.syncFSRequests>1&&P("warning: "+Ae.syncFSRequests+" FS.syncfs operations in flight at once, probably just doing extra work");var s=Ae.getMounts(Ae.root.mount),i=0;function r(e){return Ae.syncFSRequests--,t(e)}function o(e){if(e)return o.errored?void 0:(o.errored=!0,r(e));++i>=s.length&&r(null);}s.forEach((function(t){if(!t.type.syncfs)return o(null);t.type.syncfs(t,e,o);}));},mount:function(e,t,s){var i,r="/"===s,o=!s;if(r&&Ae.root)throw new Ae.ErrnoError(10);if(!r&&!o){var n=Ae.lookupPath(s,{follow_mount:!1});if(s=n.path,i=n.node,Ae.isMountpoint(i))throw new Ae.ErrnoError(10);if(!Ae.isDir(i.mode))throw new Ae.ErrnoError(54)}var a={type:e,opts:t,mountpoint:s,mounts:[]},h=e.mount(a);return h.mount=a,a.root=h,r?Ae.root=h:i&&(i.mounted=a,i.mount&&i.mount.mounts.push(a)),h},unmount:function(e){var t=Ae.lookupPath(e,{follow_mount:!1});if(!Ae.isMountpoint(t.node))throw new Ae.ErrnoError(28);var s=t.node,i=s.mounted,r=Ae.getMounts(i);Object.keys(Ae.nameTable).forEach((function(e){for(var t=Ae.nameTable[e];t;){var s=t.name_next;-1!==r.indexOf(t.mount)&&Ae.destroyNode(t),t=s;}})),s.mounted=null;var o=s.mount.mounts.indexOf(i);s.mount.mounts.splice(o,1);},lookup:function(e,t){return e.node_ops.lookup(e,t)},mknod:function(e,t,s){var i=Ae.lookupPath(e,{parent:!0}).node,r=Pe.basename(e);if(!r||"."===r||".."===r)throw new Ae.ErrnoError(28);var o=Ae.mayCreate(i,r);if(o)throw new Ae.ErrnoError(o);if(!i.node_ops.mknod)throw new Ae.ErrnoError(63);return i.node_ops.mknod(i,r,t,s)},create:function(e,t){return t=void 0!==t?t:438,t&=4095,t|=32768,Ae.mknod(e,t,0)},mkdir:function(e,t){return t=void 0!==t?t:511,t&=1023,t|=16384,Ae.mknod(e,t,0)},mkdirTree:function(e,t){for(var s=e.split("/"),i="",r=0;r<s.length;++r)if(s[r]){i+="/"+s[r];try{Ae.mkdir(i,t);}catch(e){if(20!=e.errno)throw e}}},mkdev:function(e,t,s){return void 0===s&&(s=t,t=438),t|=8192,Ae.mknod(e,t,s)},symlink:function(e,t){if(!Te.resolve(e))throw new Ae.ErrnoError(44);var s=Ae.lookupPath(t,{parent:!0}).node;if(!s)throw new Ae.ErrnoError(44);var i=Pe.basename(t),r=Ae.mayCreate(s,i);if(r)throw new Ae.ErrnoError(r);if(!s.node_ops.symlink)throw new Ae.ErrnoError(63);return s.node_ops.symlink(s,i,e)},rename:function(e,t){var s,i,r=Pe.dirname(e),o=Pe.dirname(t),n=Pe.basename(e),a=Pe.basename(t);if(s=Ae.lookupPath(e,{parent:!0}).node,i=Ae.lookupPath(t,{parent:!0}).node,!s||!i)throw new Ae.ErrnoError(44);if(s.mount!==i.mount)throw new Ae.ErrnoError(75);var h,l=Ae.lookupNode(s,n),u=Te.relative(e,o);if("."!==u.charAt(0))throw new Ae.ErrnoError(28);if("."!==(u=Te.relative(t,r)).charAt(0))throw new Ae.ErrnoError(55);try{h=Ae.lookupNode(i,a);}catch(e){}if(l!==h){var c=Ae.isDir(l.mode),p=Ae.mayDelete(s,n,c);if(p)throw new Ae.ErrnoError(p);if(p=h?Ae.mayDelete(i,a,c):Ae.mayCreate(i,a))throw new Ae.ErrnoError(p);if(!s.node_ops.rename)throw new Ae.ErrnoError(63);if(Ae.isMountpoint(l)||h&&Ae.isMountpoint(h))throw new Ae.ErrnoError(10);if(i!==s&&(p=Ae.nodePermissions(s,"w")))throw new Ae.ErrnoError(p);try{Ae.trackingDelegate.willMovePath&&Ae.trackingDelegate.willMovePath(e,t);}catch(s){P("FS.trackingDelegate['willMovePath']('"+e+"', '"+t+"') threw an exception: "+s.message);}Ae.hashRemoveNode(l);try{s.node_ops.rename(l,i,a);}catch(e){throw e}finally{Ae.hashAddNode(l);}try{Ae.trackingDelegate.onMovePath&&Ae.trackingDelegate.onMovePath(e,t);}catch(s){P("FS.trackingDelegate['onMovePath']('"+e+"', '"+t+"') threw an exception: "+s.message);}}},rmdir:function(e){var t=Ae.lookupPath(e,{parent:!0}).node,s=Pe.basename(e),i=Ae.lookupNode(t,s),r=Ae.mayDelete(t,s,!0);if(r)throw new Ae.ErrnoError(r);if(!t.node_ops.rmdir)throw new Ae.ErrnoError(63);if(Ae.isMountpoint(i))throw new Ae.ErrnoError(10);try{Ae.trackingDelegate.willDeletePath&&Ae.trackingDelegate.willDeletePath(e);}catch(t){P("FS.trackingDelegate['willDeletePath']('"+e+"') threw an exception: "+t.message);}t.node_ops.rmdir(t,s),Ae.destroyNode(i);try{Ae.trackingDelegate.onDeletePath&&Ae.trackingDelegate.onDeletePath(e);}catch(t){P("FS.trackingDelegate['onDeletePath']('"+e+"') threw an exception: "+t.message);}},readdir:function(e){var t=Ae.lookupPath(e,{follow:!0}).node;if(!t.node_ops.readdir)throw new Ae.ErrnoError(54);return t.node_ops.readdir(t)},unlink:function(e){var t=Ae.lookupPath(e,{parent:!0}).node,s=Pe.basename(e),i=Ae.lookupNode(t,s),r=Ae.mayDelete(t,s,!1);if(r)throw new Ae.ErrnoError(r);if(!t.node_ops.unlink)throw new Ae.ErrnoError(63);if(Ae.isMountpoint(i))throw new Ae.ErrnoError(10);try{Ae.trackingDelegate.willDeletePath&&Ae.trackingDelegate.willDeletePath(e);}catch(t){P("FS.trackingDelegate['willDeletePath']('"+e+"') threw an exception: "+t.message);}t.node_ops.unlink(t,s),Ae.destroyNode(i);try{Ae.trackingDelegate.onDeletePath&&Ae.trackingDelegate.onDeletePath(e);}catch(t){P("FS.trackingDelegate['onDeletePath']('"+e+"') threw an exception: "+t.message);}},readlink:function(e){var t=Ae.lookupPath(e).node;if(!t)throw new Ae.ErrnoError(44);if(!t.node_ops.readlink)throw new Ae.ErrnoError(28);return Te.resolve(Ae.getPath(t.parent),t.node_ops.readlink(t))},stat:function(e,t){var s=Ae.lookupPath(e,{follow:!t}).node;if(!s)throw new Ae.ErrnoError(44);if(!s.node_ops.getattr)throw new Ae.ErrnoError(63);return s.node_ops.getattr(s)},lstat:function(e){return Ae.stat(e,!0)},chmod:function(e,t,s){var i;if(!(i="string"==typeof e?Ae.lookupPath(e,{follow:!s}).node:e).node_ops.setattr)throw new Ae.ErrnoError(63);i.node_ops.setattr(i,{mode:4095&t|-4096&i.mode,timestamp:Date.now()});},lchmod:function(e,t){Ae.chmod(e,t,!0);},fchmod:function(e,t){var s=Ae.getStream(e);if(!s)throw new Ae.ErrnoError(8);Ae.chmod(s.node,t);},chown:function(e,t,s,i){var r;if(!(r="string"==typeof e?Ae.lookupPath(e,{follow:!i}).node:e).node_ops.setattr)throw new Ae.ErrnoError(63);r.node_ops.setattr(r,{timestamp:Date.now()});},lchown:function(e,t,s){Ae.chown(e,t,s,!0);},fchown:function(e,t,s){var i=Ae.getStream(e);if(!i)throw new Ae.ErrnoError(8);Ae.chown(i.node,t,s);},truncate:function(e,t){if(t<0)throw new Ae.ErrnoError(28);var s;if(!(s="string"==typeof e?Ae.lookupPath(e,{follow:!0}).node:e).node_ops.setattr)throw new Ae.ErrnoError(63);if(Ae.isDir(s.mode))throw new Ae.ErrnoError(31);if(!Ae.isFile(s.mode))throw new Ae.ErrnoError(28);var i=Ae.nodePermissions(s,"w");if(i)throw new Ae.ErrnoError(i);s.node_ops.setattr(s,{size:t,timestamp:Date.now()});},ftruncate:function(e,t){var s=Ae.getStream(e);if(!s)throw new Ae.ErrnoError(8);if(0==(2097155&s.flags))throw new Ae.ErrnoError(28);Ae.truncate(s.node,t);},utime:function(e,t,s){var i=Ae.lookupPath(e,{follow:!0}).node;i.node_ops.setattr(i,{timestamp:Math.max(t,s)});},open:function(e,t,s,i,o){if(""===e)throw new Ae.ErrnoError(44);var n;if(s=void 0===s?438:s,s=64&(t="string"==typeof t?Ae.modeStringToFlags(t):t)?4095&s|32768:0,"object"==typeof e)n=e;else {e=Pe.normalize(e);try{n=Ae.lookupPath(e,{follow:!(131072&t)}).node;}catch(e){}}var a=!1;if(64&t)if(n){if(128&t)throw new Ae.ErrnoError(20)}else n=Ae.mknod(e,s,0),a=!0;if(!n)throw new Ae.ErrnoError(44);if(Ae.isChrdev(n.mode)&&(t&=-513),65536&t&&!Ae.isDir(n.mode))throw new Ae.ErrnoError(54);if(!a){var h=Ae.mayOpen(n,t);if(h)throw new Ae.ErrnoError(h)}512&t&&Ae.truncate(n,0),t&=-131713;var l=Ae.createStream({node:n,path:Ae.getPath(n),flags:t,seekable:!0,position:0,stream_ops:n.stream_ops,ungotten:[],error:!1},i,o);l.stream_ops.open&&l.stream_ops.open(l),!r.logReadFiles||1&t||(Ae.readFiles||(Ae.readFiles={}),e in Ae.readFiles||(Ae.readFiles[e]=1,P("FS.trackingDelegate error on read file: "+e)));try{if(Ae.trackingDelegate.onOpenFile){var u=0;1!=(2097155&t)&&(u|=Ae.tracking.openFlags.READ),0!=(2097155&t)&&(u|=Ae.tracking.openFlags.WRITE),Ae.trackingDelegate.onOpenFile(e,u);}}catch(t){P("FS.trackingDelegate['onOpenFile']('"+e+"', flags) threw an exception: "+t.message);}return l},close:function(e){if(Ae.isClosed(e))throw new Ae.ErrnoError(8);e.getdents&&(e.getdents=null);try{e.stream_ops.close&&e.stream_ops.close(e);}catch(e){throw e}finally{Ae.closeStream(e.fd);}e.fd=null;},isClosed:function(e){return null===e.fd},llseek:function(e,t,s){if(Ae.isClosed(e))throw new Ae.ErrnoError(8);if(!e.seekable||!e.stream_ops.llseek)throw new Ae.ErrnoError(70);if(0!=s&&1!=s&&2!=s)throw new Ae.ErrnoError(28);return e.position=e.stream_ops.llseek(e,t,s),e.ungotten=[],e.position},read:function(e,t,s,i,r){if(s>>>=0,i<0||r<0)throw new Ae.ErrnoError(28);if(Ae.isClosed(e))throw new Ae.ErrnoError(8);if(1==(2097155&e.flags))throw new Ae.ErrnoError(8);if(Ae.isDir(e.node.mode))throw new Ae.ErrnoError(31);if(!e.stream_ops.read)throw new Ae.ErrnoError(28);var o=void 0!==r;if(o){if(!e.seekable)throw new Ae.ErrnoError(70)}else r=e.position;var n=e.stream_ops.read(e,t,s,i,r);return o||(e.position+=n),n},write:function(e,t,s,i,r,o){if(s>>>=0,i<0||r<0)throw new Ae.ErrnoError(28);if(Ae.isClosed(e))throw new Ae.ErrnoError(8);if(0==(2097155&e.flags))throw new Ae.ErrnoError(8);if(Ae.isDir(e.node.mode))throw new Ae.ErrnoError(31);if(!e.stream_ops.write)throw new Ae.ErrnoError(28);e.seekable&&1024&e.flags&&Ae.llseek(e,0,2);var n=void 0!==r;if(n){if(!e.seekable)throw new Ae.ErrnoError(70)}else r=e.position;var a=e.stream_ops.write(e,t,s,i,r,o);n||(e.position+=a);try{e.path&&Ae.trackingDelegate.onWriteToFile&&Ae.trackingDelegate.onWriteToFile(e.path);}catch(t){P("FS.trackingDelegate['onWriteToFile']('"+e.path+"') threw an exception: "+t.message);}return a},allocate:function(e,t,s){if(Ae.isClosed(e))throw new Ae.ErrnoError(8);if(t<0||s<=0)throw new Ae.ErrnoError(28);if(0==(2097155&e.flags))throw new Ae.ErrnoError(8);if(!Ae.isFile(e.node.mode)&&!Ae.isDir(e.node.mode))throw new Ae.ErrnoError(43);if(!e.stream_ops.allocate)throw new Ae.ErrnoError(138);e.stream_ops.allocate(e,t,s);},mmap:function(e,t,s,i,r,o){if(t>>>=0,0!=(2&r)&&0==(2&o)&&2!=(2097155&e.flags))throw new Ae.ErrnoError(2);if(1==(2097155&e.flags))throw new Ae.ErrnoError(2);if(!e.stream_ops.mmap)throw new Ae.ErrnoError(43);return e.stream_ops.mmap(e,t,s,i,r,o)},msync:function(e,t,s,i,r){return s>>>=0,e&&e.stream_ops.msync?e.stream_ops.msync(e,t,s,i,r):0},munmap:function(e){return 0},ioctl:function(e,t,s){if(!e.stream_ops.ioctl)throw new Ae.ErrnoError(59);return e.stream_ops.ioctl(e,t,s)},readFile:function(e,t){if((t=t||{}).flags=t.flags||0,t.encoding=t.encoding||"binary","utf8"!==t.encoding&&"binary"!==t.encoding)throw new Error('Invalid encoding type "'+t.encoding+'"');var s,i=Ae.open(e,t.flags),r=Ae.stat(e).size,o=new Uint8Array(r);return Ae.read(i,o,0,r,0),"utf8"===t.encoding?s=D(o,0):"binary"===t.encoding&&(s=o),Ae.close(i),s},writeFile:function(e,t,s){(s=s||{}).flags=s.flags||577;var i=Ae.open(e,s.flags,s.mode);if("string"==typeof t){var r=new Uint8Array(F(t)+1),o=C(t,r,0,r.length);Ae.write(i,r,0,o,void 0,s.canOwn);}else {if(!ArrayBuffer.isView(t))throw new Error("Unsupported data type");Ae.write(i,t,0,t.byteLength,void 0,s.canOwn);}Ae.close(i);},cwd:function(){return Ae.currentPath},chdir:function(e){var t=Ae.lookupPath(e,{follow:!0});if(null===t.node)throw new Ae.ErrnoError(44);if(!Ae.isDir(t.node.mode))throw new Ae.ErrnoError(54);var s=Ae.nodePermissions(t.node,"x");if(s)throw new Ae.ErrnoError(s);Ae.currentPath=t.path;},createDefaultDirectories:function(){Ae.mkdir("/tmp"),Ae.mkdir("/home"),Ae.mkdir("/home/web_user");},createDefaultDevices:function(){Ae.mkdir("/dev"),Ae.registerDevice(Ae.makedev(1,3),{read:function(){return 0},write:function(e,t,s,i,r){return i}}),Ae.mkdev("/dev/null",Ae.makedev(1,3)),xe.register(Ae.makedev(5,0),xe.default_tty_ops),xe.register(Ae.makedev(6,0),xe.default_tty1_ops),Ae.mkdev("/dev/tty",Ae.makedev(5,0)),Ae.mkdev("/dev/tty1",Ae.makedev(6,0));var e=function(){if("object"==typeof crypto&&"function"==typeof crypto.getRandomValues){var e=new Uint8Array(1);return function(){return crypto.getRandomValues(e),e[0]}}if(l)try{var t=x_();return function(){return t.randomBytes(1)[0]}}catch(e){}return function(){oe("randomDevice");}}();Ae.createDevice("/dev","random",e),Ae.createDevice("/dev","urandom",e),Ae.mkdir("/dev/shm"),Ae.mkdir("/dev/shm/tmp");},createSpecialDirectories:function(){Ae.mkdir("/proc"),Ae.mkdir("/proc/self"),Ae.mkdir("/proc/self/fd"),Ae.mount({mount:function(){var e=Ae.createNode("/proc/self","fd",16895,73);return e.node_ops={lookup:function(e,t){var s=+t,i=Ae.getStream(s);if(!i)throw new Ae.ErrnoError(8);var r={parent:null,mount:{mountpoint:"fake"},node_ops:{readlink:function(){return i.path}}};return r.parent=r,r}},e}},{},"/proc/self/fd");},createStandardStreams:function(){r.stdin?Ae.createDevice("/dev","stdin",r.stdin):Ae.symlink("/dev/tty","/dev/stdin"),r.stdout?Ae.createDevice("/dev","stdout",null,r.stdout):Ae.symlink("/dev/tty","/dev/stdout"),r.stderr?Ae.createDevice("/dev","stderr",null,r.stderr):Ae.symlink("/dev/tty1","/dev/stderr"),Ae.open("/dev/stdin",0),Ae.open("/dev/stdout",1),Ae.open("/dev/stderr",1);},ensureErrnoError:function(){Ae.ErrnoError||(Ae.ErrnoError=function(e,t){this.node=t,this.setErrno=function(e){this.errno=e;},this.setErrno(e),this.message="FS error";},Ae.ErrnoError.prototype=new Error,Ae.ErrnoError.prototype.constructor=Ae.ErrnoError,[44].forEach((function(e){Ae.genericErrors[e]=new Ae.ErrnoError(e),Ae.genericErrors[e].stack="<generic error, no stack>";})));},staticInit:function(){Ae.ensureErrnoError(),Ae.nameTable=new Array(4096),Ae.mount(De,{},"/"),Ae.createDefaultDirectories(),Ae.createDefaultDevices(),Ae.createSpecialDirectories(),Ae.filesystems={MEMFS:De};},init:function(e,t,s){Ae.init.initialized=!0,Ae.ensureErrnoError(),r.stdin=e||r.stdin,r.stdout=t||r.stdout,r.stderr=s||r.stderr,Ae.createStandardStreams();},quit:function(){Ae.init.initialized=!1;var e=r._fflush;e&&e(0);for(var t=0;t<Ae.streams.length;t++){var s=Ae.streams[t];s&&Ae.close(s);}},getMode:function(e,t){var s=0;return e&&(s|=365),t&&(s|=146),s},findObject:function(e,t){var s=Ae.analyzePath(e,t);return s.exists?s.object:null},analyzePath:function(e,t){try{e=(i=Ae.lookupPath(e,{follow:!t})).path;}catch(e){}var s={isRoot:!1,exists:!1,error:0,name:null,path:null,object:null,parentExists:!1,parentPath:null,parentObject:null};try{var i=Ae.lookupPath(e,{parent:!0});s.parentExists=!0,s.parentPath=i.path,s.parentObject=i.node,s.name=Pe.basename(e),i=Ae.lookupPath(e,{follow:!t}),s.exists=!0,s.path=i.path,s.object=i.node,s.name=i.node.name,s.isRoot="/"===i.path;}catch(e){s.error=e.errno;}return s},createPath:function(e,t,s,i){e="string"==typeof e?e:Ae.getPath(e);for(var r=t.split("/").reverse();r.length;){var o=r.pop();if(o){var n=Pe.join2(e,o);try{Ae.mkdir(n);}catch(e){}e=n;}}return n},createFile:function(e,t,s,i,r){var o=Pe.join2("string"==typeof e?e:Ae.getPath(e),t),n=Ae.getMode(i,r);return Ae.create(o,n)},createDataFile:function(e,t,s,i,r,o){var n=t?Pe.join2("string"==typeof e?e:Ae.getPath(e),t):e,a=Ae.getMode(i,r),h=Ae.create(n,a);if(s){if("string"==typeof s){for(var l=new Array(s.length),u=0,c=s.length;u<c;++u)l[u]=s.charCodeAt(u);s=l;}Ae.chmod(h,146|a);var p=Ae.open(h,577);Ae.write(p,s,0,s.length,0,o),Ae.close(p),Ae.chmod(h,a);}return h},createDevice:function(e,t,s,i){var r=Pe.join2("string"==typeof e?e:Ae.getPath(e),t),o=Ae.getMode(!!s,!!i);Ae.createDevice.major||(Ae.createDevice.major=64);var n=Ae.makedev(Ae.createDevice.major++,0);return Ae.registerDevice(n,{open:function(e){e.seekable=!1;},close:function(e){i&&i.buffer&&i.buffer.length&&i(10);},read:function(e,t,i,r,o){for(var n=0,a=0;a<r;a++){var h;try{h=s();}catch(e){throw new Ae.ErrnoError(29)}if(void 0===h&&0===n)throw new Ae.ErrnoError(6);if(null==h)break;n++,t[i+a]=h;}return n&&(e.node.timestamp=Date.now()),n},write:function(e,t,s,r,o){for(var n=0;n<r;n++)try{i(t[s+n]);}catch(e){throw new Ae.ErrnoError(29)}return r&&(e.node.timestamp=Date.now()),n}}),Ae.mkdev(r,o,n)},forceLoadFile:function(e){if(e.isDevice||e.isFolder||e.link||e.contents)return !0;if("undefined"!=typeof XMLHttpRequest)throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");if(!d)throw new Error("Cannot load without read() or XMLHttpRequest.");try{e.contents=us(d(e.url),!0),e.usedBytes=e.contents.length;}catch(e){throw new Ae.ErrnoError(29)}},createLazyFile:function(e,t,s,i,r){function o(){this.lengthKnown=!1,this.chunks=[];}if(o.prototype.get=function(e){if(!(e>this.length-1||e<0)){var t=e%this.chunkSize,s=e/this.chunkSize|0;return this.getter(s)[t]}},o.prototype.setDataGetter=function(e){this.getter=e;},o.prototype.cacheLength=function(){var e=new XMLHttpRequest;if(e.open("HEAD",s,!1),e.send(null),!(e.status>=200&&e.status<300||304===e.status))throw new Error("Couldn't load "+s+". Status: "+e.status);var t,i=Number(e.getResponseHeader("Content-length")),r=(t=e.getResponseHeader("Accept-Ranges"))&&"bytes"===t,o=(t=e.getResponseHeader("Content-Encoding"))&&"gzip"===t,n=1048576;r||(n=i);var a=this;a.setDataGetter((function(e){var t=e*n,r=(e+1)*n-1;if(r=Math.min(r,i-1),void 0===a.chunks[e]&&(a.chunks[e]=function(e,t){if(e>t)throw new Error("invalid range ("+e+", "+t+") or no bytes requested!");if(t>i-1)throw new Error("only "+i+" bytes available! programmer error!");var r=new XMLHttpRequest;if(r.open("GET",s,!1),i!==n&&r.setRequestHeader("Range","bytes="+e+"-"+t),"undefined"!=typeof Uint8Array&&(r.responseType="arraybuffer"),r.overrideMimeType&&r.overrideMimeType("text/plain; charset=x-user-defined"),r.send(null),!(r.status>=200&&r.status<300||304===r.status))throw new Error("Couldn't load "+s+". Status: "+r.status);return void 0!==r.response?new Uint8Array(r.response||[]):us(r.responseText||"",!0)}(t,r)),void 0===a.chunks[e])throw new Error("doXHR failed!");return a.chunks[e]})),!o&&i||(n=i=1,i=this.getter(0).length,n=i,w("LazyFiles on gzip forces download of the whole file when length is accessed")),this._length=i,this._chunkSize=n,this.lengthKnown=!0;},"undefined"!=typeof XMLHttpRequest){if(!h)throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";var n=new o;Object.defineProperties(n,{length:{get:function(){return this.lengthKnown||this.cacheLength(),this._length}},chunkSize:{get:function(){return this.lengthKnown||this.cacheLength(),this._chunkSize}}});var a={isDevice:!1,contents:n};}else a={isDevice:!1,url:s};var l=Ae.createFile(e,t,a,i,r);a.contents?l.contents=a.contents:a.url&&(l.contents=null,l.url=a.url),Object.defineProperties(l,{usedBytes:{get:function(){return this.contents.length}}});var u={};return Object.keys(l.stream_ops).forEach((function(e){var t=l.stream_ops[e];u[e]=function(){return Ae.forceLoadFile(l),t.apply(null,arguments)};})),u.read=function(e,t,s,i,r){Ae.forceLoadFile(l);var o=e.node.contents;if(r>=o.length)return 0;var n=Math.min(o.length-r,i);if(o.slice)for(var a=0;a<n;a++)t[s+a]=o[r+a];else for(a=0;a<n;a++)t[s+a]=o.get(r+a);return n},l.stream_ops=u,l},createPreloadedFile:function(e,t,s,i,o,n,a,h,l,u){Browser.init();var c=t?Te.resolve(Pe.join2(e,t)):e;function p(s){function p(s){u&&u(),h||Ae.createDataFile(e,t,s,i,o,l),n&&n(),re();}var d=!1;r.preloadPlugins.forEach((function(e){d||e.canHandle(c)&&(e.handle(s,c,p,(function(){a&&a(),re();})),d=!0);})),d||p(s);}ie(),"string"==typeof s?Browser.asyncLoad(s,(function(e){p(e);}),a):p(s);},indexedDB:function(){return window.indexedDB||window.mozIndexedDB||window.webkitIndexedDB||window.msIndexedDB},DB_NAME:function(){return "EM_FS_"+window.location.pathname},DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function(e,t,s){t=t||function(){},s=s||function(){};var i=Ae.indexedDB();try{var r=i.open(Ae.DB_NAME(),Ae.DB_VERSION);}catch(e){return s(e)}r.onupgradeneeded=function(){w("creating db"),r.result.createObjectStore(Ae.DB_STORE_NAME);},r.onsuccess=function(){var i=r.result.transaction([Ae.DB_STORE_NAME],"readwrite"),o=i.objectStore(Ae.DB_STORE_NAME),n=0,a=0,h=e.length;function l(){0==a?t():s();}e.forEach((function(e){var t=o.put(Ae.analyzePath(e).object.contents,e);t.onsuccess=function(){++n+a==h&&l();},t.onerror=function(){a++,n+a==h&&l();};})),i.onerror=s;},r.onerror=s;},loadFilesFromDB:function(e,t,s){t=t||function(){},s=s||function(){};var i=Ae.indexedDB();try{var r=i.open(Ae.DB_NAME(),Ae.DB_VERSION);}catch(e){return s(e)}r.onupgradeneeded=s,r.onsuccess=function(){var i=r.result;try{var o=i.transaction([Ae.DB_STORE_NAME],"readonly");}catch(e){return void s(e)}var n=o.objectStore(Ae.DB_STORE_NAME),a=0,h=0,l=e.length;function u(){0==h?t():s();}e.forEach((function(e){var t=n.get(e);t.onsuccess=function(){Ae.analyzePath(e).exists&&Ae.unlink(e),Ae.createDataFile(Pe.dirname(e),Pe.basename(e),t.result,!0,!0,!0),++a+h==l&&u();},t.onerror=function(){h++,a+h==l&&u();};})),o.onerror=s;},r.onerror=s;}},Ce={mappings:{},DEFAULT_POLLMASK:5,umask:511,calculateAt:function(e,t){if("/"!==t[0]){var s;if(-100===e)s=Ae.cwd();else {var i=Ae.getStream(e);if(!i)throw new Ae.ErrnoError(8);s=i.path;}t=Pe.join2(s,t);}return t},doStat:function(e,t,s){try{var i=e(t);}catch(e){if(e&&e.node&&Pe.normalize(t)!==Pe.normalize(Ae.getPath(e.node)))return -54;throw e}return L[s>>>2]=i.dev,L[s+4>>>2]=0,L[s+8>>>2]=i.ino,L[s+12>>>2]=i.mode,L[s+16>>>2]=i.nlink,L[s+20>>>2]=i.uid,L[s+24>>>2]=i.gid,L[s+28>>>2]=i.rdev,L[s+32>>>2]=0,ue=[i.size>>>0,(le=i.size,+Math.abs(le)>=1?le>0?(0|Math.min(+Math.floor(le/4294967296),4294967295))>>>0:~~+Math.ceil((le-+(~~le>>>0))/4294967296)>>>0:0)],L[s+40>>>2]=ue[0],L[s+44>>>2]=ue[1],L[s+48>>>2]=4096,L[s+52>>>2]=i.blocks,L[s+56>>>2]=i.atime.getTime()/1e3|0,L[s+60>>>2]=0,L[s+64>>>2]=i.mtime.getTime()/1e3|0,L[s+68>>>2]=0,L[s+72>>>2]=i.ctime.getTime()/1e3|0,L[s+76>>>2]=0,ue=[i.ino>>>0,(le=i.ino,+Math.abs(le)>=1?le>0?(0|Math.min(+Math.floor(le/4294967296),4294967295))>>>0:~~+Math.ceil((le-+(~~le>>>0))/4294967296)>>>0:0)],L[s+80>>>2]=ue[0],L[s+84>>>2]=ue[1],0},doMsync:function(e,t,s,i,r){var o=S.slice(e,e+s);Ae.msync(t,o,r,s,i);},doMkdir:function(e,t){return "/"===(e=Pe.normalize(e))[e.length-1]&&(e=e.substr(0,e.length-1)),Ae.mkdir(e,t,0),0},doMknod:function(e,t,s){switch(61440&t){case 32768:case 8192:case 24576:case 4096:case 49152:break;default:return -28}return Ae.mknod(e,t,s),0},doReadlink:function(e,t,s){if(s<=0)return -28;var i=Ae.readlink(e),r=Math.min(s,F(i)),o=E[t+r>>>0];return I(i,t,s+1),E[t+r>>>0]=o,r},doAccess:function(e,t){if(-8&t)return -28;var s;if(!(s=Ae.lookupPath(e,{follow:!0}).node))return -44;var i="";return 4&t&&(i+="r"),2&t&&(i+="w"),1&t&&(i+="x"),i&&Ae.nodePermissions(s,i)?-2:0},doDup:function(e,t,s){var i=Ae.getStream(s);return i&&Ae.close(i),Ae.open(e,t,0,s,s).fd},doReadv:function(e,t,s,i){for(var r=0,o=0;o<s;o++){var n=L[t+8*o>>>2],a=L[t+(8*o+4)>>>2],h=Ae.read(e,E,n,a,i);if(h<0)return -1;if(r+=h,h<a)break}return r},doWritev:function(e,t,s,i){for(var r=0,o=0;o<s;o++){var n=L[t+8*o>>>2],a=L[t+(8*o+4)>>>2],h=Ae.write(e,E,n,a,i);if(h<0)return -1;r+=h;}return r},varargs:void 0,get:function(){return Ce.varargs+=4,L[Ce.varargs-4>>>2]},getStr:function(e){return A(e)},getStreamFromFD:function(e){var t=Ae.getStream(e);if(!t)throw new Ae.ErrnoError(8);return t},get64:function(e,t){return e}},Ie={};function Fe(e){for(;e.length;){var t=e.pop();e.pop()(t);}}function Be(e){return this.fromWireType(N[e>>>2])}var Ee={},Se={},Re={};function Oe(e){if(void 0===e)return "_unknown";var t=(e=e.replace(/[^a-zA-Z0-9_]/g,"$")).charCodeAt(0);return t>=48&&t<=57?"_"+e:e}function Le(e,t){return e=Oe(e),new Function("body","return function "+e+'() {\n    "use strict";    return body.apply(this, arguments);\n};\n')(t)}function Ne(e,t){var s=Le(t,(function(e){this.name=t,this.message=e;var s=new Error(e).stack;void 0!==s&&(this.stack=this.toString()+"\n"+s.replace(/^Error(:[^\n]*)?\n/,""));}));return s.prototype=Object.create(e.prototype),s.prototype.constructor=s,s.prototype.toString=function(){return void 0===this.message?this.name:this.name+": "+this.message},s}var ke=void 0;function je(e){throw new ke(e)}function Ge(e,t,s){function i(t){var i=s(t);i.length!==e.length&&je("Mismatched type converter count");for(var r=0;r<e.length;++r)Ye(e[r],i[r]);}e.forEach((function(e){Re[e]=t;}));var r=new Array(t.length),o=[],n=0;t.forEach((function(e,t){Se.hasOwnProperty(e)?r[t]=Se[e]:(o.push(e),Ee.hasOwnProperty(e)||(Ee[e]=[]),Ee[e].push((function(){r[t]=Se[e],++n===o.length&&i(r);})));})),0===o.length&&i(r);}var He={};function Ve(e){switch(e){case 1:return 0;case 2:return 1;case 4:return 2;case 8:return 3;default:throw new TypeError("Unknown type size: "+e)}}var Ue=void 0;function ze(e){for(var t="",s=e;S[s>>>0];)t+=Ue[S[s++>>>0]];return t}var We=void 0;function Xe(e){throw new We(e)}function Ye(e,t,s){if(s=s||{},!("argPackAdvance"in t))throw new TypeError("registerType registeredInstance requires argPackAdvance");var i=t.name;if(e||Xe('type "'+i+'" must have a positive integer typeid pointer'),Se.hasOwnProperty(e)){if(s.ignoreDuplicateRegistrations)return;Xe("Cannot register type '"+i+"' twice");}if(Se[e]=t,delete Re[e],Ee.hasOwnProperty(e)){var r=Ee[e];delete Ee[e],r.forEach((function(e){e();}));}}function Ke(e){if(!(this instanceof ht))return !1;if(!(e instanceof ht))return !1;for(var t=this.$$.ptrType.registeredClass,s=this.$$.ptr,i=e.$$.ptrType.registeredClass,r=e.$$.ptr;t.baseClass;)s=t.upcast(s),t=t.baseClass;for(;i.baseClass;)r=i.upcast(r),i=i.baseClass;return t===i&&s===r}function Je(e){return {count:e.count,deleteScheduled:e.deleteScheduled,preservePointerOnDelete:e.preservePointerOnDelete,ptr:e.ptr,ptrType:e.ptrType,smartPtr:e.smartPtr,smartPtrType:e.smartPtrType}}function Ze(e){Xe(e.$$.ptrType.registeredClass.name+" instance already deleted");}var Qe=!1;function qe(e){}function $e(e){e.count.value-=1,0===e.count.value&&function(e){e.smartPtr?e.smartPtrType.rawDestructor(e.smartPtr):e.ptrType.registeredClass.rawDestructor(e.ptr);}(e);}function et(e){return "undefined"==typeof FinalizationGroup?(et=function(e){return e},e):(Qe=new FinalizationGroup((function(e){for(var t=e.next();!t.done;t=e.next()){var s=t.value;s.ptr?$e(s):console.warn("object already deleted: "+s.ptr);}})),qe=function(e){Qe.unregister(e.$$);},(et=function(e){return Qe.register(e,e.$$,e.$$),e})(e))}function tt(){if(this.$$.ptr||Ze(this),this.$$.preservePointerOnDelete)return this.$$.count.value+=1,this;var e=et(Object.create(Object.getPrototypeOf(this),{$$:{value:Je(this.$$)}}));return e.$$.count.value+=1,e.$$.deleteScheduled=!1,e}function st(){this.$$.ptr||Ze(this),this.$$.deleteScheduled&&!this.$$.preservePointerOnDelete&&Xe("Object already scheduled for deletion"),qe(this),$e(this.$$),this.$$.preservePointerOnDelete||(this.$$.smartPtr=void 0,this.$$.ptr=void 0);}function it(){return !this.$$.ptr}var rt=void 0,ot=[];function nt(){for(;ot.length;){var e=ot.pop();e.$$.deleteScheduled=!1,e.delete();}}function at(){return this.$$.ptr||Ze(this),this.$$.deleteScheduled&&!this.$$.preservePointerOnDelete&&Xe("Object already scheduled for deletion"),ot.push(this),1===ot.length&&rt&&rt(nt),this.$$.deleteScheduled=!0,this}function ht(){}var lt={};function ut(e,t,s){if(void 0===e[t].overloadTable){var i=e[t];e[t]=function(){return e[t].overloadTable.hasOwnProperty(arguments.length)||Xe("Function '"+s+"' called with an invalid number of arguments ("+arguments.length+") - expects one of ("+e[t].overloadTable+")!"),e[t].overloadTable[arguments.length].apply(this,arguments)},e[t].overloadTable=[],e[t].overloadTable[i.argCount]=i;}}function ct(e,t,s){r.hasOwnProperty(e)?((void 0===s||void 0!==r[e].overloadTable&&void 0!==r[e].overloadTable[s])&&Xe("Cannot register public name '"+e+"' twice"),ut(r,e,e),r.hasOwnProperty(s)&&Xe("Cannot register multiple overloads of a function with the same number of arguments ("+s+")!"),r[e].overloadTable[s]=t):(r[e]=t,void 0!==s&&(r[e].numArguments=s));}function pt(e,t,s,i,r,o,n,a){this.name=e,this.constructor=t,this.instancePrototype=s,this.rawDestructor=i,this.baseClass=r,this.getActualType=o,this.upcast=n,this.downcast=a,this.pureVirtualFunctions=[];}function dt(e,t,s){for(;t!==s;)t.upcast||Xe("Expected null or instance of "+s.name+", got an instance of "+t.name),e=t.upcast(e),t=t.baseClass;return e}function ft(e,t){if(null===t)return this.isReference&&Xe("null is not a valid "+this.name),0;t.$$||Xe('Cannot pass "'+zt(t)+'" as a '+this.name),t.$$.ptr||Xe("Cannot pass deleted object as a pointer of type "+this.name);var s=t.$$.ptrType.registeredClass;return dt(t.$$.ptr,s,this.registeredClass)}function mt(e,t){var s;if(null===t)return this.isReference&&Xe("null is not a valid "+this.name),this.isSmartPointer?(s=this.rawConstructor(),null!==e&&e.push(this.rawDestructor,s),s):0;t.$$||Xe('Cannot pass "'+zt(t)+'" as a '+this.name),t.$$.ptr||Xe("Cannot pass deleted object as a pointer of type "+this.name),!this.isConst&&t.$$.ptrType.isConst&&Xe("Cannot convert argument of type "+(t.$$.smartPtrType?t.$$.smartPtrType.name:t.$$.ptrType.name)+" to parameter type "+this.name);var i=t.$$.ptrType.registeredClass;if(s=dt(t.$$.ptr,i,this.registeredClass),this.isSmartPointer)switch(void 0===t.$$.smartPtr&&Xe("Passing raw pointer to smart pointer is illegal"),this.sharingPolicy){case 0:t.$$.smartPtrType===this?s=t.$$.smartPtr:Xe("Cannot convert argument of type "+(t.$$.smartPtrType?t.$$.smartPtrType.name:t.$$.ptrType.name)+" to parameter type "+this.name);break;case 1:s=t.$$.smartPtr;break;case 2:if(t.$$.smartPtrType===this)s=t.$$.smartPtr;else {var r=t.clone();s=this.rawShare(s,Ht((function(){r.delete();}))),null!==e&&e.push(this.rawDestructor,s);}break;default:Xe("Unsupporting sharing policy");}return s}function gt(e,t){if(null===t)return this.isReference&&Xe("null is not a valid "+this.name),0;t.$$||Xe('Cannot pass "'+zt(t)+'" as a '+this.name),t.$$.ptr||Xe("Cannot pass deleted object as a pointer of type "+this.name),t.$$.ptrType.isConst&&Xe("Cannot convert argument of type "+t.$$.ptrType.name+" to parameter type "+this.name);var s=t.$$.ptrType.registeredClass;return dt(t.$$.ptr,s,this.registeredClass)}function _t(e){return this.rawGetPointee&&(e=this.rawGetPointee(e)),e}function yt(e){this.rawDestructor&&this.rawDestructor(e);}function vt(e){null!==e&&e.delete();}function bt(e,t,s){if(t===s)return e;if(void 0===s.baseClass)return null;var i=bt(e,t,s.baseClass);return null===i?null:s.downcast(i)}function wt(){return Object.keys(xt).length}function Pt(){var e=[];for(var t in xt)xt.hasOwnProperty(t)&&e.push(xt[t]);return e}function Tt(e){rt=e,ot.length&&rt&&rt(nt);}var xt={};function Mt(e,t){return t=function(e,t){for(void 0===t&&Xe("ptr should not be undefined");e.baseClass;)t=e.upcast(t),e=e.baseClass;return t}(e,t),xt[t]}function Dt(e,t){return t.ptrType&&t.ptr||je("makeClassHandle requires ptr and ptrType"),!!t.smartPtrType!=!!t.smartPtr&&je("Both smartPtrType and smartPtr must be specified"),t.count={value:1},et(Object.create(e,{$$:{value:t}}))}function At(e){var t=this.getPointee(e);if(!t)return this.destructor(e),null;var s=Mt(this.registeredClass,t);if(void 0!==s){if(0===s.$$.count.value)return s.$$.ptr=t,s.$$.smartPtr=e,s.clone();var i=s.clone();return this.destructor(e),i}function r(){return this.isSmartPointer?Dt(this.registeredClass.instancePrototype,{ptrType:this.pointeeType,ptr:t,smartPtrType:this,smartPtr:e}):Dt(this.registeredClass.instancePrototype,{ptrType:this,ptr:e})}var o,n=this.registeredClass.getActualType(t),a=lt[n];if(!a)return r.call(this);o=this.isConst?a.constPointerType:a.pointerType;var h=bt(t,this.registeredClass,o.registeredClass);return null===h?r.call(this):this.isSmartPointer?Dt(o.registeredClass.instancePrototype,{ptrType:o,ptr:h,smartPtrType:this,smartPtr:e}):Dt(o.registeredClass.instancePrototype,{ptrType:o,ptr:h})}function Ct(e,t,s,i,r,o,n,a,h,l,u){this.name=e,this.registeredClass=t,this.isReference=s,this.isConst=i,this.isSmartPointer=r,this.pointeeType=o,this.sharingPolicy=n,this.rawGetPointee=a,this.rawConstructor=h,this.rawShare=l,this.rawDestructor=u,r||void 0!==t.baseClass?this.toWireType=mt:i?(this.toWireType=ft,this.destructorFunction=null):(this.toWireType=gt,this.destructorFunction=null);}function It(e,t,s){r.hasOwnProperty(e)||je("Replacing nonexistant public symbol"),void 0!==r[e].overloadTable&&void 0!==s?r[e].overloadTable[s]=t:(r[e]=t,r[e].argCount=s);}function Ft(e,t){var s=-1!=(e=ze(e)).indexOf("j")?function(e,t){x(e.indexOf("j")>=0,"getDynCaller should only be called with i64 sigs");var s=[];return function(){s.length=arguments.length;for(var i=0;i<arguments.length;i++)s[i]=arguments[i];return fe(e,t,s)}}(e,t):J.get(t);return "function"!=typeof s&&Xe("unknown function pointer with signature "+e+": "+t),s}var Bt=void 0;function Et(e){var t=ms(e),s=ze(t);return fs(t),s}function St(e,t){var s=[],i={};throw t.forEach((function e(t){i[t]||Se[t]||(Re[t]?Re[t].forEach(e):(s.push(t),i[t]=!0));})),new Bt(e+": "+s.map(Et).join([", "]))}function Rt(e,t){for(var s=[],i=0;i<e;i++)s.push(L[(t>>2)+i>>>0]);return s}function Ot(e,t,s,i,r){var o=t.length;o<2&&Xe("argTypes array size mismatch! Must at least get return value and 'this' types!");for(var n=null!==t[1]&&null!==s,a=!1,h=1;h<t.length;++h)if(null!==t[h]&&void 0===t[h].destructorFunction){a=!0;break}var l="void"!==t[0].name,u="",c="";for(h=0;h<o-2;++h)u+=(0!==h?", ":"")+"arg"+h,c+=(0!==h?", ":"")+"arg"+h+"Wired";var p="return function "+Oe(e)+"("+u+") {\nif (arguments.length !== "+(o-2)+") {\nthrowBindingError('function "+e+" called with ' + arguments.length + ' arguments, expected "+(o-2)+" args!');\n}\n";a&&(p+="var destructors = [];\n");var d=a?"destructors":"null",f=["throwBindingError","invoker","fn","runDestructors","retType","classParam"],m=[Xe,i,r,Fe,t[0],t[1]];for(n&&(p+="var thisWired = classParam.toWireType("+d+", this);\n"),h=0;h<o-2;++h)p+="var arg"+h+"Wired = argType"+h+".toWireType("+d+", arg"+h+"); // "+t[h+2].name+"\n",f.push("argType"+h),m.push(t[h+2]);if(n&&(c="thisWired"+(c.length>0?", ":"")+c),p+=(l?"var rv = ":"")+"invoker(fn"+(c.length>0?", ":"")+c+");\n",a)p+="runDestructors(destructors);\n";else for(h=n?1:2;h<t.length;++h){var g=1===h?"thisWired":"arg"+(h-2)+"Wired";null!==t[h].destructorFunction&&(p+=g+"_dtor("+g+"); // "+t[h].name+"\n",f.push(g+"_dtor"),m.push(t[h].destructorFunction));}l&&(p+="var ret = retType.fromWireType(rv);\nreturn ret;\n"),p+="}\n",f.push(p);var _=function(e,t){if(!(e instanceof Function))throw new TypeError("new_ called with constructor type "+typeof e+" which is not a function");var s=Le(e.name||"unknownFunctionName",(function(){}));s.prototype=e.prototype;var i=new s,r=e.apply(i,t);return r instanceof Object?r:i}(Function,f).apply(null,m);return _}var Lt=[],Nt=[{},{value:void 0},{value:null},{value:!0},{value:!1}];function kt(e){e>4&&0==--Nt[e].refcount&&(Nt[e]=void 0,Lt.push(e));}function jt(){for(var e=0,t=5;t<Nt.length;++t)void 0!==Nt[t]&&++e;return e}function Gt(){for(var e=5;e<Nt.length;++e)if(void 0!==Nt[e])return Nt[e];return null}function Ht(e){switch(e){case void 0:return 1;case null:return 2;case!0:return 3;case!1:return 4;default:var t=Lt.length?Lt.pop():Nt.length;return Nt[t]={refcount:1,value:e},t}}function Vt(e,t,s){switch(t){case 0:return function(e){var t=s?E:S;return this.fromWireType(t[e>>>0])};case 1:return function(e){var t=s?R:O;return this.fromWireType(t[e>>>1])};case 2:return function(e){var t=s?L:N;return this.fromWireType(t[e>>>2])};default:throw new TypeError("Unknown integer type: "+e)}}function Ut(e,t){var s=Se[e];return void 0===s&&Xe(t+" has unknown type "+Et(e)),s}function zt(e){if(null===e)return "null";var t=typeof e;return "object"===t||"array"===t||"function"===t?e.toString():""+e}function Wt(e,t){switch(t){case 2:return function(e){return this.fromWireType(k[e>>>2])};case 3:return function(e){return this.fromWireType(j[e>>>3])};default:throw new TypeError("Unknown float type: "+e)}}function Xt(e,t,s){switch(t){case 0:return s?function(e){return E[e>>>0]}:function(e){return S[e>>>0]};case 1:return s?function(e){return R[e>>>1]}:function(e){return O[e>>>1]};case 2:return s?function(e){return L[e>>>2]}:function(e){return N[e>>>2]};default:throw new TypeError("Unknown integer type: "+e)}}function Yt(e){return e||Xe("Cannot use deleted val. handle = "+e),Nt[e].value}var Kt,Jt={};function Zt(e){var t=Jt[e];return void 0===t?ze(e):t}function Qt(){return "object"==typeof globalThis?globalThis:Function("return this")()}function qt(e){try{return b.grow(e-B.byteLength+65535>>>16),K(b.buffer),1}catch(e){}}Kt=l?function(){var e=process.hrtime();return 1e3*e[0]+e[1]/1e6}:"undefined"!=typeof dateNow?dateNow:function(){return performance.now()};var $t={};function es(){if(!es.strings){var e={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:("object"==typeof navigator&&navigator.languages&&navigator.languages[0]||"C").replace("-","_")+".UTF-8",_:c||"./this.program"};for(var t in $t)e[t]=$t[t];var s=[];for(var t in e)s.push(t+"="+e[t]);es.strings=s;}return es.strings}function ts(e){return e%4==0&&(e%100!=0||e%400==0)}function ss(e,t){for(var s=0,i=0;i<=t;s+=e[i++]);return s}var is=[31,29,31,30,31,30,31,31,30,31,30,31],rs=[31,28,31,30,31,30,31,31,30,31,30,31];function os(e,t){for(var s=new Date(e.getTime());t>0;){var i=ts(s.getFullYear()),r=s.getMonth(),o=(i?is:rs)[r];if(!(t>o-s.getDate()))return s.setDate(s.getDate()+t),s;t-=o-s.getDate()+1,s.setDate(1),r<11?s.setMonth(r+1):(s.setMonth(0),s.setFullYear(s.getFullYear()+1));}return s}function ns(e,t,s,i){var r=L[i+40>>>2],o={tm_sec:L[i>>>2],tm_min:L[i+4>>>2],tm_hour:L[i+8>>>2],tm_mday:L[i+12>>>2],tm_mon:L[i+16>>>2],tm_year:L[i+20>>>2],tm_wday:L[i+24>>>2],tm_yday:L[i+28>>>2],tm_isdst:L[i+32>>>2],tm_gmtoff:L[i+36>>>2],tm_zone:r?A(r):""},n=A(s),a={"%c":"%a %b %d %H:%M:%S %Y","%D":"%m/%d/%y","%F":"%Y-%m-%d","%h":"%b","%r":"%I:%M:%S %p","%R":"%H:%M","%T":"%H:%M:%S","%x":"%m/%d/%y","%X":"%H:%M:%S","%Ec":"%c","%EC":"%C","%Ex":"%m/%d/%y","%EX":"%H:%M:%S","%Ey":"%y","%EY":"%Y","%Od":"%d","%Oe":"%e","%OH":"%H","%OI":"%I","%Om":"%m","%OM":"%M","%OS":"%S","%Ou":"%u","%OU":"%U","%OV":"%V","%Ow":"%w","%OW":"%W","%Oy":"%y"};for(var h in a)n=n.replace(new RegExp(h,"g"),a[h]);var l=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],u=["January","February","March","April","May","June","July","August","September","October","November","December"];function c(e,t,s){for(var i="number"==typeof e?e.toString():e||"";i.length<t;)i=s[0]+i;return i}function p(e,t){return c(e,t,"0")}function d(e,t){function s(e){return e<0?-1:e>0?1:0}var i;return 0===(i=s(e.getFullYear()-t.getFullYear()))&&0===(i=s(e.getMonth()-t.getMonth()))&&(i=s(e.getDate()-t.getDate())),i}function f(e){switch(e.getDay()){case 0:return new Date(e.getFullYear()-1,11,29);case 1:return e;case 2:return new Date(e.getFullYear(),0,3);case 3:return new Date(e.getFullYear(),0,2);case 4:return new Date(e.getFullYear(),0,1);case 5:return new Date(e.getFullYear()-1,11,31);case 6:return new Date(e.getFullYear()-1,11,30)}}function m(e){var t=os(new Date(e.tm_year+1900,0,1),e.tm_yday),s=new Date(t.getFullYear(),0,4),i=new Date(t.getFullYear()+1,0,4),r=f(s),o=f(i);return d(r,t)<=0?d(o,t)<=0?t.getFullYear()+1:t.getFullYear():t.getFullYear()-1}var g={"%a":function(e){return l[e.tm_wday].substring(0,3)},"%A":function(e){return l[e.tm_wday]},"%b":function(e){return u[e.tm_mon].substring(0,3)},"%B":function(e){return u[e.tm_mon]},"%C":function(e){return p((e.tm_year+1900)/100|0,2)},"%d":function(e){return p(e.tm_mday,2)},"%e":function(e){return c(e.tm_mday,2," ")},"%g":function(e){return m(e).toString().substring(2)},"%G":function(e){return m(e)},"%H":function(e){return p(e.tm_hour,2)},"%I":function(e){var t=e.tm_hour;return 0==t?t=12:t>12&&(t-=12),p(t,2)},"%j":function(e){return p(e.tm_mday+ss(ts(e.tm_year+1900)?is:rs,e.tm_mon-1),3)},"%m":function(e){return p(e.tm_mon+1,2)},"%M":function(e){return p(e.tm_min,2)},"%n":function(){return "\n"},"%p":function(e){return e.tm_hour>=0&&e.tm_hour<12?"AM":"PM"},"%S":function(e){return p(e.tm_sec,2)},"%t":function(){return "\t"},"%u":function(e){return e.tm_wday||7},"%U":function(e){var t=new Date(e.tm_year+1900,0,1),s=0===t.getDay()?t:os(t,7-t.getDay()),i=new Date(e.tm_year+1900,e.tm_mon,e.tm_mday);if(d(s,i)<0){var r=ss(ts(i.getFullYear())?is:rs,i.getMonth()-1)-31,o=31-s.getDate()+r+i.getDate();return p(Math.ceil(o/7),2)}return 0===d(s,t)?"01":"00"},"%V":function(e){var t,s=new Date(e.tm_year+1900,0,4),i=new Date(e.tm_year+1901,0,4),r=f(s),o=f(i),n=os(new Date(e.tm_year+1900,0,1),e.tm_yday);return d(n,r)<0?"53":d(o,n)<=0?"01":(t=r.getFullYear()<e.tm_year+1900?e.tm_yday+32-r.getDate():e.tm_yday+1-r.getDate(),p(Math.ceil(t/7),2))},"%w":function(e){return e.tm_wday},"%W":function(e){var t=new Date(e.tm_year,0,1),s=1===t.getDay()?t:os(t,0===t.getDay()?1:7-t.getDay()+1),i=new Date(e.tm_year+1900,e.tm_mon,e.tm_mday);if(d(s,i)<0){var r=ss(ts(i.getFullYear())?is:rs,i.getMonth()-1)-31,o=31-s.getDate()+r+i.getDate();return p(Math.ceil(o/7),2)}return 0===d(s,t)?"01":"00"},"%y":function(e){return (e.tm_year+1900).toString().substring(2)},"%Y":function(e){return e.tm_year+1900},"%z":function(e){var t=e.tm_gmtoff,s=t>=0;return t=(t=Math.abs(t)/60)/60*100+t%60,(s?"+":"-")+String("0000"+t).slice(-4)},"%Z":function(e){return e.tm_zone},"%%":function(){return "%"}};for(var h in g)n.indexOf(h)>=0&&(n=n.replace(new RegExp(h,"g"),g[h](o)));var _,y,v=us(n,!1);return v.length>t?0:(_=v,y=e,E.set(_,y>>>0),v.length-1)}var as=function(e,t,s,i){e||(e=this),this.parent=e,this.mount=e.mount,this.mounted=null,this.id=Ae.nextInode++,this.name=t,this.mode=s,this.node_ops={},this.stream_ops={},this.rdev=i;},hs=365,ls=146;function us(e,t,s){var i=s>0?s:F(e)+1,r=new Array(i),o=C(e,r,0,r.length);return t&&(r.length=o),r}Object.defineProperties(as.prototype,{read:{get:function(){return (this.mode&hs)===hs},set:function(e){e?this.mode|=hs:this.mode&=-366;}},write:{get:function(){return (this.mode&ls)===ls},set:function(e){e?this.mode|=ls:this.mode&=-147;}},isFolder:{get:function(){return Ae.isDir(this.mode)}},isDevice:{get:function(){return Ae.isChrdev(this.mode)}}}),Ae.FSNode=as,Ae.staticInit(),r.FS_createPath=Ae.createPath,r.FS_createDataFile=Ae.createDataFile,r.FS_createPreloadedFile=Ae.createPreloadedFile,r.FS_createLazyFile=Ae.createLazyFile,r.FS_createDevice=Ae.createDevice,r.FS_unlink=Ae.unlink,ke=r.InternalError=Ne(Error,"InternalError"),function(){for(var e=new Array(256),t=0;t<256;++t)e[t]=String.fromCharCode(t);Ue=e;}(),We=r.BindingError=Ne(Error,"BindingError"),ht.prototype.isAliasOf=Ke,ht.prototype.clone=tt,ht.prototype.delete=st,ht.prototype.isDeleted=it,ht.prototype.deleteLater=at,Ct.prototype.getPointee=_t,Ct.prototype.destructor=yt,Ct.prototype.argPackAdvance=8,Ct.prototype.readValueFromPointer=Be,Ct.prototype.deleteObject=vt,Ct.prototype.fromWireType=At,r.getInheritedInstanceCount=wt,r.getLiveInheritedInstances=Pt,r.flushPendingDeletes=nt,r.setDelayFunction=Tt,Bt=r.UnboundTypeError=Ne(Error,"UnboundTypeError"),r.count_emval_handles=jt,r.get_first_emval=Gt,q.push({func:function(){ps();}});var cs={z:function(e,t,s,i){oe("Assertion failed: "+A(e)+", at: "+[t?A(t):"unknown filename",s,i?A(i):"unknown function"]);},y:function(e){return ds(e+be)+be},x:function(e,t,s){throw new we(e).init(t,s),e},V:function(e,t,s){Ce.varargs=s;try{var i=Ce.getStreamFromFD(e);switch(t){case 21509:case 21505:case 21510:case 21511:case 21512:case 21506:case 21507:case 21508:case 21523:case 21524:return i.tty?0:-59;case 21519:if(!i.tty)return -59;var r=Ce.get();return L[r>>>2]=0,0;case 21520:return i.tty?-28:-59;case 21531:return r=Ce.get(),Ae.ioctl(i,t,r);default:oe("bad ioctl syscall "+t);}}catch(e){return void 0!==Ae&&e instanceof Ae.ErrnoError||oe(e),-e.errno}},W:function(e,t,s){Ce.varargs=s;try{var i=Ce.getStr(e),r=Ce.get();return Ae.open(i,t,r).fd}catch(e){return void 0!==Ae&&e instanceof Ae.ErrnoError||oe(e),-e.errno}},$:function(e){var t=Ie[e];delete Ie[e];var s=t.elements,i=s.length,r=s.map((function(e){return e.getterReturnType})).concat(s.map((function(e){return e.setterArgumentType}))),o=t.rawConstructor,n=t.rawDestructor;Ge([e],r,(function(e){return s.forEach((function(t,s){var r=e[s],o=t.getter,n=t.getterContext,a=e[s+i],h=t.setter,l=t.setterContext;t.read=function(e){return r.fromWireType(o(n,e))},t.write=function(e,t){var s=[];h(l,e,a.toWireType(s,t)),Fe(s);};})),[{name:t.name,fromWireType:function(e){for(var t=new Array(i),r=0;r<i;++r)t[r]=s[r].read(e);return n(e),t},toWireType:function(e,r){if(i!==r.length)throw new TypeError("Incorrect number of tuple elements for "+t.name+": expected="+i+", actual="+r.length);for(var a=o(),h=0;h<i;++h)s[h].write(a,r[h]);return null!==e&&e.push(n,a),a},argPackAdvance:8,readValueFromPointer:Be,destructorFunction:n}]}));},q:function(e){var t=He[e];delete He[e];var s=t.rawConstructor,i=t.rawDestructor,r=t.fields;Ge([e],r.map((function(e){return e.getterReturnType})).concat(r.map((function(e){return e.setterArgumentType}))),(function(e){var o={};return r.forEach((function(t,s){var i=t.fieldName,n=e[s],a=t.getter,h=t.getterContext,l=e[s+r.length],u=t.setter,c=t.setterContext;o[i]={read:function(e){return n.fromWireType(a(h,e))},write:function(e,t){var s=[];u(c,e,l.toWireType(s,t)),Fe(s);}};})),[{name:t.name,fromWireType:function(e){var t={};for(var s in o)t[s]=o[s].read(e);return i(e),t},toWireType:function(e,t){for(var r in o)if(!(r in t))throw new TypeError('Missing field:  "'+r+'"');var n=s();for(r in o)o[r].write(n,t[r]);return null!==e&&e.push(i,n),n},argPackAdvance:8,readValueFromPointer:Be,destructorFunction:i}]}));},Y:function(e,t,s,i,r){var o=Ve(s);Ye(e,{name:t=ze(t),fromWireType:function(e){return !!e},toWireType:function(e,t){return t?i:r},argPackAdvance:8,readValueFromPointer:function(e){var i;if(1===s)i=E;else if(2===s)i=R;else {if(4!==s)throw new TypeError("Unknown boolean type size: "+t);i=L;}return this.fromWireType(i[e>>>o])},destructorFunction:null});},t:function(e,t,s,i,r,o,n,a,h,l,u,c,p){u=ze(u),o=Ft(r,o),a&&(a=Ft(n,a)),l&&(l=Ft(h,l)),p=Ft(c,p);var d=Oe(u);ct(d,(function(){St("Cannot construct "+u+" due to unbound types",[i]);})),Ge([e,t,s],i?[i]:[],(function(t){var s,r;t=t[0],r=i?(s=t.registeredClass).instancePrototype:ht.prototype;var n=Le(d,(function(){if(Object.getPrototypeOf(this)!==h)throw new We("Use 'new' to construct "+u);if(void 0===c.constructor_body)throw new We(u+" has no accessible constructor");var e=c.constructor_body[arguments.length];if(void 0===e)throw new We("Tried to invoke ctor of "+u+" with invalid number of parameters ("+arguments.length+") - expected ("+Object.keys(c.constructor_body).toString()+") parameters instead!");return e.apply(this,arguments)})),h=Object.create(r,{constructor:{value:n}});n.prototype=h;var c=new pt(u,n,h,p,s,o,a,l),f=new Ct(u,c,!0,!1,!1),m=new Ct(u+"*",c,!1,!1,!1),g=new Ct(u+" const*",c,!1,!0,!1);return lt[e]={pointerType:m,constPointerType:g},It(d,n),[f,m,g]}));},s:function(e,t,s,i,r,o){x(t>0);var n=Rt(t,s);r=Ft(i,r);var a=[o],h=[];Ge([],[e],(function(e){var s="constructor "+(e=e[0]).name;if(void 0===e.registeredClass.constructor_body&&(e.registeredClass.constructor_body=[]),void 0!==e.registeredClass.constructor_body[t-1])throw new We("Cannot register multiple constructors with identical number of parameters ("+(t-1)+") for class '"+e.name+"'! Overload resolution is currently only performed using the parameter count, not actual type info!");return e.registeredClass.constructor_body[t-1]=function(){St("Cannot construct "+e.name+" due to unbound types",n);},Ge([],n,(function(i){return e.registeredClass.constructor_body[t-1]=function(){arguments.length!==t-1&&Xe(s+" called with "+arguments.length+" arguments, expected "+(t-1)),h.length=0,a.length=t;for(var e=1;e<t;++e)a[e]=i[e].toWireType(h,arguments[e-1]);var o=r.apply(null,a);return Fe(h),i[0].fromWireType(o)},[]})),[]}));},c:function(e,t,s,i,r,o,n,a){var h=Rt(s,i);t=ze(t),o=Ft(r,o),Ge([],[e],(function(e){var i=(e=e[0]).name+"."+t;function r(){St("Cannot call "+i+" due to unbound types",h);}a&&e.registeredClass.pureVirtualFunctions.push(t);var l=e.registeredClass.instancePrototype,u=l[t];return void 0===u||void 0===u.overloadTable&&u.className!==e.name&&u.argCount===s-2?(r.argCount=s-2,r.className=e.name,l[t]=r):(ut(l,t,i),l[t].overloadTable[s-2]=r),Ge([],h,(function(r){var a=Ot(i,r,e,o,n);return void 0===l[t].overloadTable?(a.argCount=s-2,l[t]=a):l[t].overloadTable[s-2]=a,[]})),[]}));},X:function(e,t){Ye(e,{name:t=ze(t),fromWireType:function(e){var t=Nt[e].value;return kt(e),t},toWireType:function(e,t){return Ht(t)},argPackAdvance:8,readValueFromPointer:Be,destructorFunction:null});},_:function(e,t,s,i){var r=Ve(s);function o(){}t=ze(t),o.values={},Ye(e,{name:t,constructor:o,fromWireType:function(e){return this.constructor.values[e]},toWireType:function(e,t){return t.value},argPackAdvance:8,readValueFromPointer:Vt(t,r,i),destructorFunction:null}),ct(t,o);},v:function(e,t,s){var i=Ut(e,"enum");t=ze(t);var r=i.constructor,o=Object.create(i.constructor.prototype,{value:{value:s},constructor:{value:Le(i.name+"_"+t,(function(){}))}});r.values[s]=o,r[t]=o;},F:function(e,t,s){var i=Ve(s);Ye(e,{name:t=ze(t),fromWireType:function(e){return e},toWireType:function(e,t){if("number"!=typeof t&&"boolean"!=typeof t)throw new TypeError('Cannot convert "'+zt(t)+'" to '+this.name);return t},argPackAdvance:8,readValueFromPointer:Wt(t,i),destructorFunction:null});},f:function(e,t,s,i,r,o){var n=Rt(t,s);e=ze(e),r=Ft(i,r),ct(e,(function(){St("Cannot call "+e+" due to unbound types",n);}),t-1),Ge([],n,(function(s){var i=[s[0],null].concat(s.slice(1));return It(e,Ot(e,i,null,r,o),t-1),[]}));},o:function(e,t,s,i,r){t=ze(t),-1===r&&(r=4294967295);var o=Ve(s),n=function(e){return e};if(0===i){var a=32-8*s;n=function(e){return e<<a>>>a};}var h=-1!=t.indexOf("unsigned");Ye(e,{name:t,fromWireType:n,toWireType:function(e,s){if("number"!=typeof s&&"boolean"!=typeof s)throw new TypeError('Cannot convert "'+zt(s)+'" to '+this.name);if(s<i||s>r)throw new TypeError('Passing a number "'+zt(s)+'" from JS side to C/C++ side to an argument of type "'+t+'", which is outside the valid range ['+i+", "+r+"]!");return h?s>>>0:0|s},argPackAdvance:8,readValueFromPointer:Xt(t,o,0!==i),destructorFunction:null});},k:function(e,t,s){var i=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array][t];function r(e){var t=N,s=t[(e>>=2)>>>0],r=t[e+1>>>0];return new i(B,r,s)}Ye(e,{name:s=ze(s),fromWireType:r,argPackAdvance:8,readValueFromPointer:r},{ignoreDuplicateRegistrations:!0});},G:function(e,t){var s="std::string"===(t=ze(t));Ye(e,{name:t,fromWireType:function(e){var t,i=N[e>>>2];if(s)for(var r=e+4,o=0;o<=i;++o){var n=e+4+o;if(o==i||0==S[n>>>0]){var a=A(r,n-r);void 0===t?t=a:(t+=String.fromCharCode(0),t+=a),r=n+1;}}else {var h=new Array(i);for(o=0;o<i;++o)h[o]=String.fromCharCode(S[e+4+o>>>0]);t=h.join("");}return fs(e),t},toWireType:function(e,t){t instanceof ArrayBuffer&&(t=new Uint8Array(t));var i="string"==typeof t;i||t instanceof Uint8Array||t instanceof Uint8ClampedArray||t instanceof Int8Array||Xe("Cannot pass non-string to std::string");var r=(s&&i?function(){return F(t)}:function(){return t.length})(),o=ds(4+r+1);if(N[(o>>>=0)>>>2]=r,s&&i)I(t,o+4,r+1);else if(i)for(var n=0;n<r;++n){var a=t.charCodeAt(n);a>255&&(fs(o),Xe("String has UTF-16 code units that do not fit in 8 bits")),S[o+4+n>>>0]=a;}else for(n=0;n<r;++n)S[o+4+n>>>0]=t[n];return null!==e&&e.push(fs,o),o},argPackAdvance:8,readValueFromPointer:Be,destructorFunction:function(e){fs(e);}});},w:function(e,t,s){var i,r,o,n,a;s=ze(s),2===t?(i=H,r=V,n=U,o=function(){return O},a=1):4===t&&(i=z,r=W,n=X,o=function(){return N},a=2),Ye(e,{name:s,fromWireType:function(e){for(var s,r=N[e>>>2],n=o(),h=e+4,l=0;l<=r;++l){var u=e+4+l*t;if(l==r||0==n[u>>>a]){var c=i(h,u-h);void 0===s?s=c:(s+=String.fromCharCode(0),s+=c),h=u+t;}}return fs(e),s},toWireType:function(e,i){"string"!=typeof i&&Xe("Cannot pass non-string to C++ string type "+s);var o=n(i),h=ds(4+o+t);return N[(h>>>=0)>>>2]=o>>a,r(i,h+4,o+t),null!==e&&e.push(fs,h),h},argPackAdvance:8,readValueFromPointer:Be,destructorFunction:function(e){fs(e);}});},aa:function(e,t,s,i,r,o){Ie[e]={name:ze(t),rawConstructor:Ft(s,i),rawDestructor:Ft(r,o),elements:[]};},h:function(e,t,s,i,r,o,n,a,h){Ie[e].elements.push({getterReturnType:t,getter:Ft(s,i),getterContext:r,setterArgumentType:o,setter:Ft(n,a),setterContext:h});},r:function(e,t,s,i,r,o){He[e]={name:ze(t),rawConstructor:Ft(s,i),rawDestructor:Ft(r,o),fields:[]};},e:function(e,t,s,i,r,o,n,a,h,l){He[e].fields.push({fieldName:ze(t),getterReturnType:s,getter:Ft(i,r),getterContext:o,setterArgumentType:n,setter:Ft(a,h),setterContext:l});},Z:function(e,t){Ye(e,{isVoid:!0,name:t=ze(t),argPackAdvance:0,fromWireType:function(){},toWireType:function(e,t){}});},m:function(e,t,s){e=Yt(e),t=Ut(t,"emval::as");var i=[],r=Ht(i);return L[s>>>2]=r,t.toWireType(i,e)},H:function(e,t,s,i){e=Yt(e);for(var r=function(e,t){for(var s=new Array(e),i=0;i<e;++i)s[i]=Ut(L[(t>>2)+i>>>0],"parameter "+i);return s}(t,s),o=new Array(t),n=0;n<t;++n){var a=r[n];o[n]=a.readValueFromPointer(i),i+=a.argPackAdvance;}return Ht(e.apply(void 0,o))},b:kt,J:function(e){return 0===e?Ht(Qt()):(e=Zt(e),Ht(Qt()[e]))},n:function(e,t){return Ht((e=Yt(e))[t=Yt(t)])},j:function(e){e>4&&(Nt[e].refcount+=1);},N:function(e,t){return (e=Yt(e))instanceof(t=Yt(t))},I:function(e){return "number"==typeof(e=Yt(e))},A:function(){return Ht([])},g:function(e){return Ht(Zt(e))},u:function(){return Ht({})},l:function(e){Fe(Nt[e].value),kt(e);},i:function(e,t,s){e=Yt(e),t=Yt(t),s=Yt(s),e[t]=s;},d:function(e,t){return Ht((e=Ut(e,"_emval_take_value")).readValueFromPointer(t))},C:function(){oe();},T:function(e,t){var s,i;if(0===e)s=Date.now();else {if(1!==e&&4!==e)return i=28,L[_s()>>>2]=i,-1;s=Kt();}return L[t>>>2]=s/1e3|0,L[t+4>>>2]=s%1e3*1e3*1e3|0,0},M:function(e,t,s){S.copyWithin(e>>>0,t>>>0,t+s>>>0);},p:function(e){e>>>=0;var t=S.length,s=4294967296;if(e>s)return !1;for(var i=1;i<=4;i*=2){var r=t*(1+.2/i);if(r=Math.min(r,e+100663296),qt(Math.min(s,Y(Math.max(16777216,e,r),65536))))return !0}return !1},R:function(e,t){try{var s=0;return es().forEach((function(i,r){var o=t+s;L[e+4*r>>>2]=o,function(e,t,s){for(var i=0;i<e.length;++i)E[t++>>>0]=e.charCodeAt(i);s||(E[t>>>0]=0);}(i,o),s+=i.length+1;})),0}catch(e){return void 0!==Ae&&e instanceof Ae.ErrnoError||oe(e),e.errno}},S:function(e,t){try{var s=es();L[e>>>2]=s.length;var i=0;return s.forEach((function(e){i+=e.length+1;})),L[t>>>2]=i,0}catch(e){return void 0!==Ae&&e instanceof Ae.ErrnoError||oe(e),e.errno}},E:function(e){try{var t=Ce.getStreamFromFD(e);return Ae.close(t),0}catch(e){return void 0!==Ae&&e instanceof Ae.ErrnoError||oe(e),e.errno}},U:function(e,t,s,i){try{var r=Ce.getStreamFromFD(e),o=Ce.doReadv(r,t,s);return L[i>>>2]=o,0}catch(e){return void 0!==Ae&&e instanceof Ae.ErrnoError||oe(e),e.errno}},K:function(e,t,s,i,r){try{var o=Ce.getStreamFromFD(e),n=4294967296*s+(t>>>0),a=9007199254740992;return n<=-a||n>=a?-61:(Ae.llseek(o,n,i),ue=[o.position>>>0,(le=o.position,+Math.abs(le)>=1?le>0?(0|Math.min(+Math.floor(le/4294967296),4294967295))>>>0:~~+Math.ceil((le-+(~~le>>>0))/4294967296)>>>0:0)],L[r>>>2]=ue[0],L[r+4>>>2]=ue[1],o.getdents&&0===n&&0===i&&(o.getdents=null),0)}catch(e){return void 0!==Ae&&e instanceof Ae.ErrnoError||oe(e),e.errno}},D:function(e,t,s,i){try{var r=Ce.getStreamFromFD(e),o=Ce.doWritev(r,t,s);return L[i>>>2]=o,0}catch(e){return void 0!==Ae&&e instanceof Ae.ErrnoError||oe(e),e.errno}},a:b,B:function(){},P:function(){},O:function(){},L:function(e){},Q:function(e,t,s,i){return ns(e,t,s,i)}};!function(){var e={a:cs};function t(e,t){var s=e.exports;r.asm=s,J=r.asm.ba,re();}function s(e){t(e.instance);}function o(t){return (y||!a&&!h||"function"!=typeof fetch||he(ce)?Promise.resolve().then(pe):fetch(ce,{credentials:"same-origin"}).then((function(e){if(!e.ok)throw "failed to load wasm binary file at '"+ce+"'";return e.arrayBuffer()})).catch((function(){return pe()}))).then((function(t){return WebAssembly.instantiate(t,e)})).then(t,(function(e){P("failed to asynchronously prepare wasm: "+e),oe(e);}))}if(ie(),r.instantiateWasm)try{return r.instantiateWasm(e,t)}catch(e){return P("Module.instantiateWasm callback failed with error: "+e),!1}(y||"function"!=typeof WebAssembly.instantiateStreaming||ae(ce)||he(ce)||"function"!=typeof fetch?o(s):fetch(ce,{credentials:"same-origin"}).then((function(t){return WebAssembly.instantiateStreaming(t,e).then(s,(function(e){return P("wasm streaming compile failed: "+e),P("falling back to ArrayBuffer instantiation"),o(s)}))}))).catch(i);}();var ps=r.___wasm_call_ctors=function(){return (ps=r.___wasm_call_ctors=r.asm.ca).apply(null,arguments)};r._main=function(){return (r._main=r.asm.da).apply(null,arguments)};var ds=r._malloc=function(){return (ds=r._malloc=r.asm.ea).apply(null,arguments)},fs=r._free=function(){return (fs=r._free=r.asm.fa).apply(null,arguments)},ms=r.___getTypeName=function(){return (ms=r.___getTypeName=r.asm.ga).apply(null,arguments)};r.___embind_register_native_and_builtin_types=function(){return (r.___embind_register_native_and_builtin_types=r.asm.ha).apply(null,arguments)};var gs,_s=r.___errno_location=function(){return (_s=r.___errno_location=r.asm.ia).apply(null,arguments)};function ys(e){this.name="ExitStatus",this.message="Program terminated with exit("+e+")",this.status=e;}function vs(e){var t,s=r._main;try{t=s(0,0),!0&&v&&0===t||(v||(r.onExit&&r.onExit(t),T=!0),p(t,new ys(t)));}catch(e){if(e instanceof ys)return;if("unwind"==e)return void(v=!0);var i=e;e&&"object"==typeof e&&e.stack&&(i=[e,e.stack]),P("exception thrown: "+i),p(1,e);}}function bs(e){function s(){gs||(gs=!0,r.calledRun=!0,T||(r.noFSInit||Ae.init.initialized||Ae.init(),de(q),Ae.ignorePermissions=!1,de($),t(r),r.onRuntimeInitialized&&r.onRuntimeInitialized(),ws&&vs(),function(){if(r.postRun)for("function"==typeof r.postRun&&(r.postRun=[r.postRun]);r.postRun.length;)e=r.postRun.shift(),ee.unshift(e);var e;de(ee);}()));}te>0||(function(){if(r.preRun)for("function"==typeof r.preRun&&(r.preRun=[r.preRun]);r.preRun.length;)e=r.preRun.shift(),Q.unshift(e);var e;de(Q);}(),te>0||(r.setStatus?(r.setStatus("Running..."),setTimeout((function(){setTimeout((function(){r.setStatus("");}),1),s();}),1)):s()));}if(r.dynCall_jiji=function(){return (r.dynCall_jiji=r.asm.ja).apply(null,arguments)},r.dynCall_viijii=function(){return (r.dynCall_viijii=r.asm.ka).apply(null,arguments)},r.dynCall_iiiiiijj=function(){return (r.dynCall_iiiiiijj=r.asm.la).apply(null,arguments)},r.dynCall_iiiiij=function(){return (r.dynCall_iiiiij=r.asm.ma).apply(null,arguments)},r.dynCall_iiiiijj=function(){return (r.dynCall_iiiiijj=r.asm.na).apply(null,arguments)},r.addRunDependency=ie,r.removeRunDependency=re,r.FS_createPath=Ae.createPath,r.FS_createDataFile=Ae.createDataFile,r.FS_createPreloadedFile=Ae.createPreloadedFile,r.FS_createLazyFile=Ae.createLazyFile,r.FS_createDevice=Ae.createDevice,r.FS_unlink=Ae.unlink,r.FS=Ae,se=function e(){gs||bs(),gs||(se=e);},r.run=bs,r.preInit)for("function"==typeof r.preInit&&(r.preInit=[r.preInit]);r.preInit.length>0;)r.preInit.pop()();var ws=!0;return r.noInitialRun&&(ws=!1),v=!0,bs(),e.ready});"object"==typeof e&&"object"==typeof t?t.exports=i:"function"==typeof define&&define.amd?define([],(function(){return i})):"object"==typeof e&&(e.WebIFCWasm=i);}});f_="undefined"!=typeof self&&self.crossOriginIsolated?M_():D_();class jE{constructor(e={}){this._eventSubIDMap=null,this._eventSubEvents=null,this._eventSubs=null,this._events=null,this._locale="en",this._messages={},this._locales=[],this._locale="en",this.messages=e.messages,this.locale=e.locale;}set messages(e){this._messages=e||{},this._locales=Object.keys(this._messages),this.fire("updated",this);}loadMessages(e={}){for(let t in e)this._messages[t]=e[t];this.messages=this._messages;}clearMessages(){this.messages={};}get locales(){return this._locales}set locale(e){e=e||"de",this._locale!==e&&(this._locale=e,this.fire("updated",e));}get locale(){return this._locale}translate(e,t){const s=this._messages[this._locale];if(!s)return null;const i=GE(e,s);return i?t?HE(i,t):i:null}translatePlurals(e,t,s){const i=this._messages[this._locale];if(!i)return null;let r=GE(e,i);return r=0===(t=parseInt(""+t,10))?r.zero:t>1?r.other:r.one,r?(r=HE(r,[t]),s&&(r=HE(r,s)),r):null}fire(e,t,s){this._events||(this._events={}),this._eventSubs||(this._eventSubs={}),!0!==s&&(this._events[e]=t||!0);const i=this._eventSubs[e];if(i)for(const e in i)if(i.hasOwnProperty(e)){i[e].callback(t);}}on(e,t){this._events||(this._events={}),this._eventSubIDMap||(this._eventSubIDMap=new s),this._eventSubEvents||(this._eventSubEvents={}),this._eventSubs||(this._eventSubs={});let i=this._eventSubs[e];i||(i={},this._eventSubs[e]=i);const r=this._eventSubIDMap.addItem();i[r]={callback:t},this._eventSubEvents[r]=e;const o=this._events[e];return void 0!==o&&t(o),r}off(e){if(null==e)return;if(!this._eventSubEvents)return;const t=this._eventSubEvents[e];if(t){delete this._eventSubEvents[e];const s=this._eventSubs[t];s&&delete s[e],this._eventSubIDMap.removeItem(e);}}}function GE(e,t){if(t[e])return t[e];const s=e.split(".");let i=t;for(let e=0,t=s.length;i&&e<t;e++){i=i[s[e]];}return i}function HE(e,t=[]){return e.replace(/\{\{|\}\}|\{(\d+)\}/g,(function(e,s){return "{{"===e?"{":"}}"===e?"}":t[s]}))}const zE=f.vec3();const XE=f.vec3(),YE=f.vec3(),KE=f.vec3(),JE=f.vec3(),ZE=f.vec3();class QE extends B{get type(){return "CameraFlightAnimation"}constructor(e,t={}){super(e,t),this._look1=f.vec3(),this._eye1=f.vec3(),this._up1=f.vec3(),this._look2=f.vec3(),this._eye2=f.vec3(),this._up2=f.vec3(),this._orthoScale1=1,this._orthoScale2=1,this._flying=!1,this._flyEyeLookUp=!1,this._flyingEye=!1,this._flyingLook=!1,this._callback=null,this._callbackScope=null,this._time1=null,this._time2=null,this.easing=!1!==t.easing,this.duration=t.duration,this.fit=t.fit,this.fitFOV=t.fitFOV,this.trail=t.trail;}flyTo(e,t,s){e=e||this.scene,this._flying&&this.stop(),this._flying=!1,this._flyingEye=!1,this._flyingLook=!1,this._flyingEyeLookUp=!1,this._callback=t,this._callbackScope=s;const i=this.scene.camera,r=!!e.projection&&e.projection!==i.projection;let o,n,a,h,l;if(this._eye1[0]=i.eye[0],this._eye1[1]=i.eye[1],this._eye1[2]=i.eye[2],this._look1[0]=i.look[0],this._look1[1]=i.look[1],this._look1[2]=i.look[2],this._up1[0]=i.up[0],this._up1[1]=i.up[1],this._up1[2]=i.up[2],this._orthoScale1=i.ortho.scale,this._orthoScale2=e.orthoScale||this._orthoScale1,e.aabb)o=e.aabb;else if(6===e.length)o=e;else if(e.eye&&e.look||e.up)n=e.eye,a=e.look,h=e.up;else if(e.eye)n=e.eye;else if(e.look)a=e.look;else {let i=e;if((b.isNumeric(i)||b.isString(i))&&(l=i,i=this.scene.components[l],!i))return this.error("Component not found: "+b.inQuotes(l)),void(t&&(s?t.call(s):t()));r||(o=i.aabb||this.scene.aabb);}const u=e.poi;if(o){if(o[3]<o[0]||o[4]<o[1]||o[5]<o[2])return;if(o[3]===o[0]&&o[4]===o[1]&&o[5]===o[2])return;o=o.slice();const t=f.getAABB3Center(o);this._look2=u||t;const s=f.subVec3(this._eye1,this._look1,XE),i=f.normalizeVec3(s),r=u?f.getAABB3DiagPoint(o,u):f.getAABB3Diag(o),n=e.fitFOV||this._fitFOV,a=Math.abs(r/Math.tan(n*f.DEGTORAD));this._orthoScale2=1.1*r,this._eye2[0]=this._look2[0]+i[0]*a,this._eye2[1]=this._look2[1]+i[1]*a,this._eye2[2]=this._look2[2]+i[2]*a,this._up2[0]=this._up1[0],this._up2[1]=this._up1[1],this._up2[2]=this._up1[2],this._flyingEyeLookUp=!0;}else (n||a||h)&&(this._flyingEyeLookUp=!!n&&!!a&&!!h,this._flyingEye=!!n&&!a,this._flyingLook=!!a&&!n,n&&(this._eye2[0]=n[0],this._eye2[1]=n[1],this._eye2[2]=n[2]),a&&(this._look2[0]=a[0],this._look2[1]=a[1],this._look2[2]=a[2]),h&&(this._up2[0]=h[0],this._up2[1]=h[1],this._up2[2]=h[2]));r?("ortho"===e.projection&&"ortho"!==i.projection&&(this._projection2="ortho",this._projMatrix1=i.projMatrix.slice(),this._projMatrix2=i.ortho.matrix.slice(),i.projection="customProjection"),"perspective"===e.projection&&"perspective"!==i.projection&&(this._projection2="perspective",this._projMatrix1=i.projMatrix.slice(),this._projMatrix2=i.perspective.matrix.slice(),i.projection="customProjection")):this._projection2=null,this.fire("started",e,!0),this._time1=Date.now(),this._time2=this._time1+(e.duration?1e3*e.duration:this._duration),this._flying=!0,I.scheduleTask(this._update,this);}jumpTo(e){this._jumpTo(e);}_jumpTo(e){this._flying&&this.stop();const t=this.scene.camera;var s,i,r,o,n;if(e.aabb)s=e.aabb;else if(6===e.length)s=e;else if(e.eye||e.look||e.up)r=e.eye,o=e.look,n=e.up;else {let t=e;if((b.isNumeric(t)||b.isString(t))&&(i=t,t=this.scene.components[i],!t))return void this.error("Component not found: "+b.inQuotes(i));s=t.aabb||this.scene.aabb;}const a=e.poi;if(s){if(s[3]<=s[0]||s[4]<=s[1]||s[5]<=s[2])return;var h=a?f.getAABB3DiagPoint(s,a):f.getAABB3Diag(s);let i;o=a||f.getAABB3Center(s,o),this._trail?f.subVec3(t.look,o,ZE):f.subVec3(t.eye,t.look,ZE),f.normalizeVec3(ZE);i=(void 0!==e.fit?e.fit:this._fit)?Math.abs(h/Math.tan((e.fitFOV||this._fitFOV)*f.DEGTORAD)):f.lenVec3(f.subVec3(t.eye,t.look,XE)),f.mulVec3Scalar(ZE,i),t.eye=f.addVec3(o,ZE,XE),t.look=o,this.scene.camera.ortho.scale=1.1*h;}else (r||o||n)&&(r&&(t.eye=r),o&&(t.look=o),n&&(t.up=n));e.projection&&(t.projection=e.projection);}_update(){if(!this._flying)return;let e=(Date.now()-this._time1)/(this._time2-this._time1);const t=e>=1;e>1&&(e=1);const s=this.easing?QE._ease(e,0,1,1):e,i=this.scene.camera;if(this._flyingEye||this._flyingLook?this._flyingEye?(f.subVec3(i.eye,i.look,ZE),i.eye=f.lerpVec3(s,0,1,this._eye1,this._eye2,KE),i.look=f.subVec3(KE,ZE,YE)):this._flyingLook&&(i.look=f.lerpVec3(s,0,1,this._look1,this._look2,YE),i.up=f.lerpVec3(s,0,1,this._up1,this._up2,JE)):this._flyingEyeLookUp&&(i.eye=f.lerpVec3(s,0,1,this._eye1,this._eye2,KE),i.look=f.lerpVec3(s,0,1,this._look1,this._look2,YE),i.up=f.lerpVec3(s,0,1,this._up1,this._up2,JE)),this._projection2){const t="ortho"===this._projection2?QE._easeOutExpo(e,0,1,1):QE._easeInCubic(e,0,1,1);i.customProjection.matrix=f.lerpMat4(t,0,1,this._projMatrix1,this._projMatrix2);}else i.ortho.scale=this._orthoScale1+e*(this._orthoScale2-this._orthoScale1);if(t)return i.ortho.scale=this._orthoScale2,void this.stop();I.scheduleTask(this._update,this);}static _ease(e,t,s,i){return -s*(e/=i)*(e-2)+t}static _easeInCubic(e,t,s,i){return s*(e/=i)*e*e+t}static _easeOutExpo(e,t,s,i){return s*(1-Math.pow(2,-10*e/i))+t}stop(){if(!this._flying)return;this._flying=!1,this._time1=null,this._time2=null,this._projection2&&(this.scene.camera.projection=this._projection2);const e=this._callback;e&&(this._callback=null,this._callbackScope?e.call(this._callbackScope):e()),this.fire("stopped",!0,!0);}cancel(){this._flying&&(this._flying=!1,this._time1=null,this._time2=null,this._callback&&(this._callback=null),this.fire("canceled",!0,!0));}set duration(e){this._duration=e?1e3*e:500,this.stop();}get duration(){return this._duration/1e3}set fit(e){this._fit=!1!==e;}get fit(){return this._fit}set fitFOV(e){this._fitFOV=e||45;}get fitFOV(){return this._fitFOV}set trail(e){this._trail=!!e;}get trail(){return this._trail}destroy(){this.stop(),super.destroy();}}var $E={};$E.load=function(e,t){var s=new XMLHttpRequest;s.open("GET",e,!0),s.responseType="arraybuffer",s.onload=function(e){t(e.target.response);},s.send();},$E.save=function(e,t){var s="data:application/octet-stream;base64,"+btoa($E.parse._buffToStr(e));window.location.href=s;},$E.clone=function(e){return JSON.parse(JSON.stringify(e))},$E.bin={},$E.bin.f=new Float32Array(1),$E.bin.fb=new Uint8Array($E.bin.f.buffer),$E.bin.rf=function(e,t){for(var s=$E.bin.f,i=$E.bin.fb,r=0;r<4;r++)i[r]=e[t+r];return s[0]},$E.bin.rsl=function(e,t){return e[t]|e[t+1]<<8},$E.bin.ril=function(e,t){return e[t]|e[t+1]<<8|e[t+2]<<16|e[t+3]<<24},$E.bin.rASCII0=function(e,t){for(var s="";0!=e[t];)s+=String.fromCharCode(e[t++]);return s},$E.bin.wf=function(e,t,s){new Float32Array(e.buffer,t,1)[0]=s;},$E.bin.wsl=function(e,t,s){e[t]=s,e[t+1]=s>>8;},$E.bin.wil=function(e,t,s){e[t]=s,e[t+1]=s>>8,e[t+2]=s>>16,e[t+3];},$E.parse={},$E.parse._buffToStr=function(e){for(var t=new Uint8Array(e),s="",i=0;i<t.length;i++)s=s.concat(String.fromCharCode(t[i]));return s},$E.parse._strToBuff=function(e){for(var t=new ArrayBuffer(e.length),s=new Uint8Array(t),i=0;i<e.length;i++)s[i]=e.charCodeAt(i);return t},$E.parse._readLine=function(e,t){for(var s="";10!=e[t];)s+=String.fromCharCode(e[t++]);return s},$E.parse.fromJSON=function(e){return JSON.parse($E.parse._buffToStr(e))},$E.parse.toJSON=function(e){var t=JSON.stringify(e);return $E.parse._strToBuff(t)},$E.parse.fromOBJ=function(e){for(var t={groups:{},c_verts:[],c_uvt:[],c_norms:[],i_verts:[],i_uvt:[],i_norms:[]},s={from:0,to:0},i=0,r=new Uint8Array(e);i<r.length;){var o=$E.parse._readLine(r,i);i+=o.length+1;var n=(o=(o=o.replace(/ +(?= )/g,"")).replace(/(^\s+|\s+$)/g,"")).split(" ");if("g"==n[0]&&(s.to=t.i_verts.length,null==t.groups[n[1]]&&(t.groups[n[1]]={from:t.i_verts.length,to:0}),s=t.groups[n[1]]),"v"==n[0]){var a=parseFloat(n[1]),h=parseFloat(n[2]),l=parseFloat(n[3]);t.c_verts.push(a,h,l);}if("vt"==n[0]){a=parseFloat(n[1]),h=1-parseFloat(n[2]);t.c_uvt.push(a,h);}if("vn"==n[0]){a=parseFloat(n[1]),h=parseFloat(n[2]),l=parseFloat(n[3]);t.c_norms.push(a,h,l);}if("f"==n[0]){var u=n[1].split("/"),c=n[2].split("/"),p=n[3].split("/"),d=parseInt(u[0])-1,f=parseInt(c[0])-1,m=parseInt(p[0])-1,g=parseInt(u[1])-1,_=parseInt(c[1])-1,y=parseInt(p[1])-1,v=parseInt(u[2])-1,b=parseInt(c[2])-1,w=parseInt(p[2])-1,P=t.c_verts.length/3,T=t.c_uvt.length/2,x=t.c_norms.length/3;if(d<0&&(d=P+d+1),f<0&&(f=P+f+1),m<0&&(m=P+m+1),g<0&&(g=T+g+1),_<0&&(_=T+_+1),y<0&&(y=T+y+1),v<0&&(v=x+v+1),b<0&&(b=x+b+1),w<0&&(w=x+w+1),t.i_verts.push(d,f,m),t.i_uvt.push(g,_,y),t.i_norms.push(v,b,w),5==n.length){var M=n[4].split("/"),D=parseInt(M[0])-1,A=parseInt(M[1])-1,C=parseInt(M[2])-1;D<0&&(D=P+D+1),A<0&&(A=T+A+1),C<0&&(C=x+C+1),t.i_verts.push(d,m,D),t.i_uvt.push(g,y,A),t.i_norms.push(v,w,C);}}}return s.to=t.i_verts.length,t},$E.parse.fromMD2=function(e){e=new Uint8Array(e);var t={},s={};s.ident=$E.bin.ril(e,0),s.version=$E.bin.ril(e,4),s.skinwidth=$E.bin.ril(e,8),s.skinheight=$E.bin.ril(e,12),s.framesize=$E.bin.ril(e,16),s.num_skins=$E.bin.ril(e,20),s.num_vertices=$E.bin.ril(e,24),s.num_st=$E.bin.ril(e,28),s.num_tris=$E.bin.ril(e,32),s.num_glcmds=$E.bin.ril(e,36),s.num_frames=$E.bin.ril(e,40),s.offset_skins=$E.bin.ril(e,44),s.offset_st=$E.bin.ril(e,48),s.offset_tris=$E.bin.ril(e,52),s.offset_frames=$E.bin.ril(e,56),s.offset_glcmds=$E.bin.ril(e,60),s.offset_end=$E.bin.ril(e,64);var i=s.offset_st;t.c_uvt=[];for(var r=0;r<s.num_st;r++){var o=$E.bin.rsl(e,i)/s.skinwidth,n=$E.bin.rsl(e,i+2)/s.skinheight;t.c_uvt.push(o,n),i+=4;}i=s.offset_tris;var a=[],h=[];t.i_verts=a,t.i_uvt=h;for(r=0;r<s.num_tris;r++)a.push($E.bin.rsl(e,i),$E.bin.rsl(e,i+2),$E.bin.rsl(e,i+4)),h.push($E.bin.rsl(e,i+6),$E.bin.rsl(e,i+8),$E.bin.rsl(e,i+10)),i+=12;i=s.offset_skins;t.skins=[];for(r=0;r<s.num_skins;r++)t.skins.push($E.bin.rASCII0(e,i)),i+=64;i=s.offset_frames;t.frames=[];var l=$E.parse.fromMD2._normals;for(r=0;r<s.num_frames;r++){var u={},c=$E.bin.rf(e,i),p=$E.bin.rf(e,i+4),d=$E.bin.rf(e,i+8);i+=12;var f=$E.bin.rf(e,i),m=$E.bin.rf(e,i+4),g=$E.bin.rf(e,i+8);i+=12,u.name=$E.bin.rASCII0(e,i),i+=16,u.verts=[],u.norms=[];for(var _=0;_<s.num_vertices;_++)u.verts.push(e[i]*c+f,e[i+1]*p+m,e[i+2]*d+g),u.norms.push(l[3*e[i+3]],l[3*e[i+3]+1],l[3*e[i+3]+2]),i+=4;t.frames.push(u);}return t},$E.parse.fromMD2._normals=[-.525731,0,.850651,-.442863,.238856,.864188,-.295242,0,.955423,-.309017,.5,.809017,-.16246,.262866,.951056,0,0,1,0,.850651,.525731,-.147621,.716567,.681718,.147621,.716567,.681718,0,.525731,.850651,.309017,.5,.809017,.525731,0,.850651,.295242,0,.955423,.442863,.238856,.864188,.16246,.262866,.951056,-.681718,.147621,.716567,-.809017,.309017,.5,-.587785,.425325,.688191,-.850651,.525731,0,-.864188,.442863,.238856,-.716567,.681718,.147621,-.688191,.587785,.425325,-.5,.809017,.309017,-.238856,.864188,.442863,-.425325,.688191,.587785,-.716567,.681718,-.147621,-.5,.809017,-.309017,-.525731,.850651,0,0,.850651,-.525731,-.238856,.864188,-.442863,0,.955423,-.295242,-.262866,.951056,-.16246,0,1,0,0,.955423,.295242,-.262866,.951056,.16246,.238856,.864188,.442863,.262866,.951056,.16246,.5,.809017,.309017,.238856,.864188,-.442863,.262866,.951056,-.16246,.5,.809017,-.309017,.850651,.525731,0,.716567,.681718,.147621,.716567,.681718,-.147621,.525731,.850651,0,.425325,.688191,.587785,.864188,.442863,.238856,.688191,.587785,.425325,.809017,.309017,.5,.681718,.147621,.716567,.587785,.425325,.688191,.955423,.295242,0,1,0,0,.951056,.16246,.262866,.850651,-.525731,0,.955423,-.295242,0,.864188,-.442863,.238856,.951056,-.16246,.262866,.809017,-.309017,.5,.681718,-.147621,.716567,.850651,0,.525731,.864188,.442863,-.238856,.809017,.309017,-.5,.951056,.16246,-.262866,.525731,0,-.850651,.681718,.147621,-.716567,.681718,-.147621,-.716567,.850651,0,-.525731,.809017,-.309017,-.5,.864188,-.442863,-.238856,.951056,-.16246,-.262866,.147621,.716567,-.681718,.309017,.5,-.809017,.425325,.688191,-.587785,.442863,.238856,-.864188,.587785,.425325,-.688191,.688191,.587785,-.425325,-.147621,.716567,-.681718,-.309017,.5,-.809017,0,.525731,-.850651,-.525731,0,-.850651,-.442863,.238856,-.864188,-.295242,0,-.955423,-.16246,.262866,-.951056,0,0,-1,.295242,0,-.955423,.16246,.262866,-.951056,-.442863,-.238856,-.864188,-.309017,-.5,-.809017,-.16246,-.262866,-.951056,0,-.850651,-.525731,-.147621,-.716567,-.681718,.147621,-.716567,-.681718,0,-.525731,-.850651,.309017,-.5,-.809017,.442863,-.238856,-.864188,.16246,-.262866,-.951056,.238856,-.864188,-.442863,.5,-.809017,-.309017,.425325,-.688191,-.587785,.716567,-.681718,-.147621,.688191,-.587785,-.425325,.587785,-.425325,-.688191,0,-.955423,-.295242,0,-1,0,.262866,-.951056,-.16246,0,-.850651,.525731,0,-.955423,.295242,.238856,-.864188,.442863,.262866,-.951056,.16246,.5,-.809017,.309017,.716567,-.681718,.147621,.525731,-.850651,0,-.238856,-.864188,-.442863,-.5,-.809017,-.309017,-.262866,-.951056,-.16246,-.850651,-.525731,0,-.716567,-.681718,-.147621,-.716567,-.681718,.147621,-.525731,-.850651,0,-.5,-.809017,.309017,-.238856,-.864188,.442863,-.262866,-.951056,.16246,-.864188,-.442863,.238856,-.809017,-.309017,.5,-.688191,-.587785,.425325,-.681718,-.147621,.716567,-.442863,-.238856,.864188,-.587785,-.425325,.688191,-.309017,-.5,.809017,-.147621,-.716567,.681718,-.425325,-.688191,.587785,-.16246,-.262866,.951056,.442863,-.238856,.864188,.16246,-.262866,.951056,.309017,-.5,.809017,.147621,-.716567,.681718,0,-.525731,.850651,.425325,-.688191,.587785,.587785,-.425325,.688191,.688191,-.587785,.425325,-.955423,.295242,0,-.951056,.16246,.262866,-1,0,0,-.850651,0,.525731,-.955423,-.295242,0,-.951056,-.16246,.262866,-.864188,.442863,-.238856,-.951056,.16246,-.262866,-.809017,.309017,-.5,-.864188,-.442863,-.238856,-.951056,-.16246,-.262866,-.809017,-.309017,-.5,-.681718,.147621,-.716567,-.681718,-.147621,-.716567,-.850651,0,-.525731,-.688191,.587785,-.425325,-.587785,.425325,-.688191,-.425325,.688191,-.587785,-.425325,-.688191,-.587785,-.587785,-.425325,-.688191,-.688191,-.587785,-.425325],$E.parse.fromCollada=function(e){var t=$E.parse._buffToStr(e),s=(new DOMParser).parseFromString(t,"text/xml"),i={},r=(s=s.childNodes[0]).getElementsByTagName("asset")[0],o=s.getElementsByTagName("library_geometries")[0],n=s.getElementsByTagName("library_images")[0],a=s.getElementsByTagName("library_materials")[0],h=s.getElementsByTagName("library_effects")[0];return r&&(i.asset=$E.parse.fromCollada._asset(r)),o&&(i.geometries=$E.parse.fromCollada._libGeometries(o)),n&&(i.images=$E.parse.fromCollada._libImages(n)),a&&(i.materials=$E.parse.fromCollada._libMaterials(a)),h&&(i.effects=$E.parse.fromCollada._libEffects(h)),i},$E.parse.fromCollada._asset=function(e){return {created:e.getElementsByTagName("created")[0].textContent,modified:e.getElementsByTagName("modified")[0].textContent,up_axis:e.getElementsByTagName("up_axis")[0].textContent}},$E.parse.fromCollada._libGeometries=function(e){e=e.getElementsByTagName("geometry");for(var t=[],s=0;s<e.length;s++){var i=e[s],r=$E.parse.fromCollada._getMesh(i.getElementsByTagName("mesh")[0]);t.push(r);}return t},$E.parse.fromCollada._getMesh=function(e){for(var t={},s=e.getElementsByTagName("source"),i=t.sources={},r=0;r<s.length;r++){for(var o=s[r].getElementsByTagName("float_array")[0].textContent.split(" "),n=o.length-(""==o[o.length-1]?1:0),a=new Array(n),h=0;h<n;h++)a[h]=parseFloat(o[h]);i[s[r].getAttribute("id")]=a;}t.triangles=[];var l=e.getElementsByTagName("triangles");if(null==l)return t;for(r=0;r<l.length;r++){var u={},c=l[r];u.material=c.getAttribute("material");var p=c.getElementsByTagName("input"),d=[];for(h=0;h<p.length;h++){var f=p[h];a=[];d[parseInt(f.getAttribute("offset"))]=a;var m=f.getAttribute("semantic");u["s_"+m]="VERTEX"==m?e.getElementsByTagName("vertices")[0].getElementsByTagName("input")[0].getAttribute("source").substring(1):f.getAttribute("source").substring(1),u["i_"+m]=a,i[u["s_"+m]];}var g=c.getElementsByTagName("p")[0].textContent.split(" "),_=3*Math.floor(g.length/3);for(h=0;h<_;h++)d[h%p.length].push(parseInt(g[h]));t.triangles.push(u);}return t},$E.parse.fromCollada._libImages=function(e){e=e.getElementsByTagName("image");for(var t={},s=0;s<e.length;s++)t[e[s].getAttribute("id")]=e[s].getElementsByTagName("init_from")[0].textContent;return t},$E.parse.fromCollada._libMaterials=function(e){e=e.getElementsByTagName("material");for(var t={},s=0;s<e.length;s++)t[e[s].getAttribute("name")]=e[s].getElementsByTagName("instance_effect")[0].getAttribute("url").substring(1);return t},$E.parse.fromCollada._libEffects=function(e){e=e.getElementsByTagName("effect");for(var t={},s=0;s<e.length;s++){for(var i={},r=e[s].getElementsByTagName("newparam"),o=0;o<r.length;o++){var n=r[o].getElementsByTagName("surface")[0];n&&(i.surface=n.getElementsByTagName("init_from")[0].textContent);}t[e[s].getAttribute("id")]=i;}return t},$E.parse.from3DS=function(e){e=new Uint8Array(e);var t={};if(19789!=$E.bin.rsl(e,0))return null;for(var s=$E.bin.ril(e,2),i=6;i<s;){var r=$E.bin.rsl(e,i),o=$E.bin.ril(e,i+2);15677==r&&(t.edit=$E.parse.from3DS._edit3ds(e,i,o)),45056==r&&(t.keyf=$E.parse.from3DS._keyf3ds(e,i,o)),i+=o;}return t},$E.parse.from3DS._edit3ds=function(e,t,s){for(var i={},r=t+6;r<t+s;){var o=$E.bin.rsl(e,r),n=$E.bin.ril(e,r+2);16384==o&&(null==i.objects&&(i.objects=[]),i.objects.push($E.parse.from3DS._edit_object(e,r,n))),r+=n;}return i},$E.parse.from3DS._keyf3ds=function(e,t,s){for(var i={},r=t+6;r<t+s;){var o=$E.bin.rsl(e,r),n=$E.bin.ril(e,r+2);45058==o&&(null==i.desc&&(i.desc=[]),i.desc.push($E.parse.from3DS._keyf_objdes(e,r,n))),r+=n;}return i},$E.parse.from3DS._keyf_objdes=function(e,t,s){for(var i={},r=t+6;r<t+s;){var o=$E.bin.rsl(e,r),n=$E.bin.ril(e,r+2);45072==o&&(i.hierarchy=$E.parse.from3DS._keyf_objhierarch(e,r,n)),45073==o&&(i.dummy_name=$E.bin.rASCII0(e,r+6)),r+=n;}return i},$E.parse.from3DS._keyf_objhierarch=function(e,t,s){var i={},r=t+6;return i.name=$E.bin.rASCII0(e,r),r+=i.name.length+1,i.hierarchy=$E.bin.rsl(e,r+4),i},$E.parse.from3DS._edit_object=function(e,t,s){var i={},r=t+6;for(i.name=$E.bin.rASCII0(e,r),r+=i.name.length+1;r<t+s;){var o=$E.bin.rsl(e,r),n=$E.bin.ril(e,r+2);16640==o&&(i.mesh=$E.parse.from3DS._obj_trimesh(e,r,n)),r+=n;}return i},$E.parse.from3DS._obj_trimesh=function(e,t,s){for(var i={},r=t+6;r<t+s;){var o=$E.bin.rsl(e,r),n=$E.bin.ril(e,r+2);16656==o&&(i.vertices=$E.parse.from3DS._tri_vertexl(e,r,n)),16672==o&&(i.indices=$E.parse.from3DS._tri_facel1(e,r,n)),16704==o&&(i.uvt=$E.parse.from3DS._tri_mappingcoors(e,r,n)),16736==o&&(i.local=$E.parse.from3DS._tri_local(e,r,n)),r+=n;}return i},$E.parse.from3DS._tri_vertexl=function(e,t,s){var i=[],r=t+6,o=$E.bin.rsl(e,r);r+=2;for(var n=0;n<o;n++)i.push($E.bin.rf(e,r)),i.push($E.bin.rf(e,r+4)),i.push($E.bin.rf(e,r+8)),r+=12;return i},$E.parse.from3DS._tri_facel1=function(e,t,s){var i=[],r=t+6,o=$E.bin.rsl(e,r);r+=2;for(var n=0;n<o;n++)i.push($E.bin.rsl(e,r)),i.push($E.bin.rsl(e,r+2)),i.push($E.bin.rsl(e,r+4)),r+=8;return i},$E.parse.from3DS._tri_mappingcoors=function(e,t,s){var i=[],r=t+6,o=$E.bin.rsl(e,r);r+=2;for(var n=0;n<o;n++)i.push($E.bin.rf(e,r)),i.push(1-$E.bin.rf(e,r+4)),r+=8;return i},$E.parse.from3DS._tri_local=function(e,t,s){var i={},r=t+6;return i.X=[$E.bin.rf(e,r),$E.bin.rf(e,r+4),$E.bin.rf(e,r+8)],r+=12,i.Y=[$E.bin.rf(e,r),$E.bin.rf(e,r+4),$E.bin.rf(e,r+8)],r+=12,i.Z=[$E.bin.rf(e,r),$E.bin.rf(e,r+4),$E.bin.rf(e,r+8)],r+=12,i.C=[$E.bin.rf(e,r),$E.bin.rf(e,r+4),$E.bin.rf(e,r+8)],r+=12,i},$E.parse.fromBIV=function(e){e=new Uint8Array(e);var t={},s={};return s.id=$E.bin.ril(e,0),s.verS=$E.bin.ril(e,4),s.texS=$E.bin.ril(e,8),s.indS=$E.bin.ril(e,12),s.verO=$E.bin.ril(e,16),s.verL=$E.bin.ril(e,20),s.texO=$E.bin.ril(e,24),s.texL=$E.bin.ril(e,28),s.indO=$E.bin.ril(e,32),s.indL=$E.bin.ril(e,36),0!=s.verO&&(t.vertices=$E.parse.fromBIV._readFloats(e,s.verO,s.verL)),0!=s.texO&&(t.uvt=$E.parse.fromBIV._readFloats(e,s.texO,s.texL)),0!=s.indO&&(t.indices=$E.parse.fromBIV._readInts(e,s.indO,s.indL,s.indS)),t},$E.parse.toBIV=function(e){for(var t=0,s=0;s<e.indices.length;s++)t=Math.max(t,e.indices[s]);var i=32;t<=65535&&(i=16);var r=40;e.vertices&&(r+=4*e.vertices.length),e.uvt&&(r+=4*e.uvt.length),e.indices&&(r+=e.indices.length*i/8);var o=new Uint8Array(r);$E.bin.wil(o,0,1769365870),$E.bin.wil(o,4,32),$E.bin.wil(o,8,32),$E.bin.wil(o,12,i);var n=40;return e.vertices&&($E.bin.wil(o,16,n),$E.bin.wil(o,20,4*e.vertices.length),$E.parse.fromBIV._writeFloats(o,n,e.vertices),n+=4*e.vertices.length),e.uvt&&($E.bin.wil(o,24,n),$E.bin.wil(o,28,4*e.uvt.length),$E.parse.fromBIV._writeFloats(o,n,e.uvt),n+=4*e.uvt.length),e.indices&&($E.bin.wil(o,32,n),$E.bin.wil(o,36,4*e.indices.length),$E.parse.fromBIV._writeInts(o,n,e.indices,i)),o.buffer},$E.parse.fromBIV._readFloats=function(e,t,s){for(var i=[],r=0;r<s/4;r++)i.push($E.bin.rf(e,t+4*r));return i},$E.parse.fromBIV._writeFloats=function(e,t,s){for(var i=0;i<s.length;i++)$E.bin.wf(e,t+4*i,s[i]);},$E.parse.fromBIV._readInts=function(e,t,s,i){for(var r=[],o=0;o<s/4;o++)16==i&&r.push($E.bin.rsl(e,t+2*o)),32==i&&r.push($E.bin.ril(e,t+4*o));return r},$E.parse.fromBIV._writeInts=function(e,t,s,i){for(var r=0;r<s.length;r++)16==i&&$E.bin.wsl(e,t+2*r,s[r]),32==i&&$E.bin.wil(e,t+4*r,s[r]);},$E.gen={},$E.gen.Plane=function(e,t,s,i){s||(s=1),i||(i=1);for(var r={verts:[],inds:[],uvt:[]},o=e+1,n=t+1,a=0;a<n;a++)for(var h=0;h<o;h++){var l=h*(2/e)-1,u=a*(2/t)-1;r.verts.push(l,u,0),r.uvt.push(s*h/e,i*a/t),a<t&&h<e&&r.inds.push(a*o+h,a*o+h+1,(a+1)*o+h,a*o+h+1,(a+1)*o+h,(a+1)*o+h+1);}return r},$E.gen.Cube=function(){return {verts:[-1,1,-1,1,1,-1,-1,-1,-1,1,-1,-1,-1,1,1,1,1,1,-1,-1,1,1,-1,1,-1,1,1,-1,1,-1,-1,-1,1,-1,-1,-1,1,1,1,1,1,-1,1,-1,1,1,-1,-1,-1,1,-1,1,1,-1,-1,1,1,1,1,1,-1,-1,-1,1,-1,-1,-1,-1,1,1,-1,1],inds:[0,1,2,1,2,3,4,5,6,5,6,7,8,9,10,9,10,11,12,13,14,13,14,15,16,17,18,17,18,19,20,21,22,21,22,23],uvt:[1/4,1/4,.5,1/4,1/4,.5,.5,.5,1,1/4,3/4,1/4,1,.5,3/4,.5,0,1/4,1/4,1/4,0,.5,1/4,.5,3/4,1/4,.5,1/4,3/4,.5,.5,.5,1/4,1/4,.5,1/4,1/4,0,.5,0,1/4,.5,.5,.5,1/4,3/4,.5,3/4]}},$E.gen.Sphere=function(e,t){for(var s={verts:[],inds:[],uvt:[]},i=e+1,r=t+1,o=0;o<r;o++)for(var n=0;n<i;n++){var a=-Math.PI/2+o*Math.PI/t,h=2*n*Math.PI/e,l=Math.cos(a)*Math.cos(h),u=Math.sin(a),c=Math.cos(a)*Math.sin(h);s.verts.push(l,u,c),s.uvt.push(n/e,o/t),o<t&&n<e&&s.inds.push(i*o+n,i*o+n+1,i*(o+1)+n,i*o+n+1,i*(o+1)+n,i*(o+1)+n+1);}return s},$E.mat={},$E.mat.scale=function(e,t,s){return [e,0,0,0,0,t,0,0,0,0,s,0,0,0,0,1]},$E.mat.translate=function(e,t,s){return [1,0,0,0,0,1,0,0,0,0,1,0,e,t,s,1]},$E.mat.rotateDeg=function(e,t,s){var i=Math.PI/180;return $E.mat.rotate(e*i,t*i,s*i)},$E.mat.rotate=function(e,t,s){var i=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],r=e,o=t,n=s,a=Math.cos(r),h=Math.cos(o),l=Math.cos(n),u=Math.sin(r),c=Math.sin(o),p=Math.sin(n);return i[0]=h*l,i[1]=-h*p,i[2]=c,i[4]=a*p+u*c*l,i[5]=a*l-u*c*p,i[6]=-u*h,i[8]=u*p-a*c*l,i[9]=u*l+a*c*p,i[10]=a*h,i},$E.edit={},$E.edit.interpolate=function(e,t,s,i){for(var r=0;r<e.length;r++)s[r]=e[r]+i*(t[r]-e[r]);},$E.edit.transform=function(e,t){for(var s=0;s<e.length;s+=3){var i=e[s],r=e[s+1],o=e[s+2];e[s+0]=t[0]*i+t[4]*r+t[8]*o+t[12],e[s+1]=t[1]*i+t[5]*r+t[9]*o+t[13],e[s+2]=t[2]*i+t[6]*r+t[10]*o+t[14];}},$E.edit.unwrap=function(e,t,s){for(var i=new Array(Math.floor(e.length/3)*s),r=0;r<e.length;r++)for(var o=0;o<s;o++)i[r*s+o]=t[e[r]*s+o];return i},$E.edit.remap=function(e,t,s,i){for(var r=new Array(s.length),o=0;o<e.length;o++)for(var n=0;n<i;n++)r[t[o]*i+n]=s[e[o]*i+n];return r},$E.utils={},$E.utils.getAABB=function(e){var t,s,i,r,o,n;r=o=n=-(t=s=i=999999999);for(var a=0;a<e.length;a+=3){var h=e[a+0],l=e[a+1],u=e[a+2];h<t&&(t=h),h>r&&(r=h),l<s&&(s=l),l>o&&(o=l),u<i&&(i=u),l>n&&(n=u);}return {min:{x:t,y:s,z:i},max:{x:r,y:o,z:n}}};const oS=f.vec3(),nS=f.vec3();f.vec3();const aS=f.vec3([0,-1,0]),hS=f.vec4([0,0,0,1]);const vS=f.vec3();class bS{constructor(e){if(this.objectsVisible=[],this.objectsEdges=[],this.objectsXrayed=[],this.objectsHighlighted=[],this.objectsSelected=[],this.objectsClippable=[],this.objectsPickable=[],this.objectsColorize=[],this.objectsOpacity=[],this.numObjects=0,e){const t=e.metaScene.scene;this.saveObjects(t,e);}}saveObjects(e,t,s){const i=t.rootMetaObject;if(!i)return;const r=i.getObjectIDsInSubtree();this.numObjects=0,this._mask=s?b.apply(s,{}):null;const o=e.objects,n=!s||s.visible,a=!s||s.edges,h=!s||s.xrayed,l=!s||s.highlighted,u=!s||s.selected,c=!s||s.clippable,p=!s||s.pickable,d=!s||s.colorize,f=!s||s.opacity;for(var m=0,g=r.length;m<g;m++){const e=o[r[m]];if(e){if(n&&(this.objectsVisible[m]=e.visible),a&&(this.objectsEdges[m]=e.edges),h&&(this.objectsXrayed[m]=e.xrayed),l&&(this.objectsHighlighted[m]=e.highlighted),u&&(this.objectsSelected[m]=e.selected),c&&(this.objectsClippable[m]=e.clippable),p&&(this.objectsPickable[m]=e.pickable),d){const t=e.colorize;this.objectsColorize[3*m+0]=t[0],this.objectsColorize[3*m+1]=t[1],this.objectsColorize[3*m+2]=t[2];}f&&(this.objectsOpacity[m]=e.opacity),this.numObjects++;}}}restoreObjects(e,t){const s=t.rootMetaObject;if(!s)return;const i=s.getObjectIDsInSubtree(),r=this._mask,o=!r||r.visible,n=!r||r.edges,a=!r||r.xrayed,h=!r||r.highlighted,l=!r||r.selected,u=!r||r.clippable,c=!r||r.pickable,p=!r||r.colorize,d=!r||r.opacity,f=e.objects;for(var m=0,g=i.length;m<g;m++){const e=f[i[m]];e&&(o&&(e.visible=this.objectsVisible[m]),n&&(e.edges=this.objectsEdges[m]),a&&(e.xrayed=this.objectsXrayed[m]),h&&(e.highlighted=this.objectsHighlighted[m]),l&&(e.selected=this.objectsSelected[m]),u&&(e.clippable=this.objectsClippable[m]),c&&(e.pickable=this.objectsPickable[m]),p&&(vS[0]=this.objectsColorize[3*m+0],vS[1]=this.objectsColorize[3*m+1],vS[2]=this.objectsColorize[3*m+2],e.colorize=vS),d&&(e.opacity=this.objectsOpacity[m]));}}}const MS=f.vec4(),DS=f.vec4(),AS=f.vec3(),CS=f.vec3(),IS=f.vec3(),FS=f.vec4(),BS=f.vec4(),ES=f.vec4();class SS{constructor(e){this._scene=e;}dollyToCanvasPos(e,t,s){let i=!1;const r=this._scene.camera;if(e){const t=f.subVec3(e,r.eye,AS);i=f.lenVec3(t)<s;}if("perspective"===r.projection){r.ortho.scale=r.ortho.scale-s;const i=this._unproject(t,FS),o=f.subVec3(i,r.eye,ES),n=f.mulVec3Scalar(f.normalizeVec3(o),-s,[]);if(r.eye=[r.eye[0]-n[0],r.eye[1]-n[1],r.eye[2]-n[2]],r.look=[r.look[0]-n[0],r.look[1]-n[1],r.look[2]-n[2]],e){const t=f.subVec3(e,r.eye,AS),s=f.lenVec3(t),i=f.mulVec3Scalar(f.normalizeVec3(f.subVec3(r.look,r.eye,CS)),s);r.look=[r.eye[0]+i[0],r.eye[1]+i[1],r.eye[2]+i[2]];}}else if("ortho"===r.projection){const e=this._unproject(t,FS);r.ortho.scale=r.ortho.scale-s,r.ortho._update();const i=this._unproject(t,BS),o=f.subVec3(i,e,ES),n=f.mulVec3Scalar(f.normalizeVec3(f.subVec3(r.look,r.eye,AS)),-s,CS),a=f.addVec3(o,n,IS);r.eye=[r.eye[0]-a[0],r.eye[1]-a[1],r.eye[2]-a[2]],r.look=[r.look[0]-a[0],r.look[1]-a[1],r.look[2]-a[2]];}return i}_unproject(e,t){const s=this._scene.camera,i=s.project.transposedMatrix,r=i.subarray(8,12),o=i.subarray(12),n=[0,0,-1,1],a=f.dotVec4(n,r)/f.dotVec4(n,o);return s.project.unproject(e,a,MS,DS,t),t}destroy(){}}const RS=f.vec3(),OS=f.vec3(),LS=f.vec3(),NS=f.vec4(),kS=f.vec4(),jS=f.vec4();class GS{constructor(e,t){this._scene=e,this._configs=t,this._pivotWorldPos=f.vec3(),this._cameraOffset=f.vec3(),this._azimuth=0,this._polar=0,this._radius=0,this._pivotPosSet=!1,this._pivoting=!1,this._shown=!1,this._pivotViewPos=f.vec4(),this._pivotProjPos=f.vec4(),this._pivotCanvasPos=f.vec2(),this._cameraDirty=!0,this._onViewMatrix=this._scene.camera.on("viewMatrix",(()=>{this._cameraDirty=!0;})),this._onProjMatrix=this._scene.camera.on("projMatrix",(()=>{this._cameraDirty=!0;})),this._onTick=this._scene.on("tick",(()=>{this.updatePivotElement();}));}updatePivotElement(){const e=this._scene.camera,t=this._scene.canvas;if(this._pivoting&&this._cameraDirty){f.transformPoint3(e.viewMatrix,this.getPivotPos(),this._pivotViewPos),this._pivotViewPos[3]=1,f.transformPoint4(e.projMatrix,this._pivotViewPos,this._pivotProjPos);const s=t.boundary,i=s[2],r=s[3];this._pivotCanvasPos[0]=Math.floor((1+this._pivotProjPos[0]/this._pivotProjPos[3])*i/2),this._pivotCanvasPos[1]=Math.floor((1-this._pivotProjPos[1]/this._pivotProjPos[3])*r/2);const o=t.canvas.getBoundingClientRect();this._pivotElement&&(this._pivotElement.style.left=Math.floor(o.left+this._pivotCanvasPos[0])-this._pivotElement.clientWidth/2+window.scrollX+"px",this._pivotElement.style.top=Math.floor(o.top+this._pivotCanvasPos[1])-this._pivotElement.clientHeight/2+window.scrollY+"px"),this._cameraDirty=!1;}}setPivotElement(e){this._pivotElement=e;}startPivot(){if(this._cameraLookingDownwards())return this._pivoting=!1,!1;const e=this._scene.camera;let t=f.lookAtMat4v(e.eye,e.look,e.worldUp);f.transformPoint3(t,this.getPivotPos(),this._cameraOffset);const s=this.getPivotPos();this._cameraOffset[2]+=f.distVec3(e.eye,s),t=f.inverseMat4(t);const i=f.transformVec3(t,this._cameraOffset),r=f.vec3();if(f.subVec3(e.eye,s,r),f.addVec3(r,i),e.zUp){const e=r[1];r[1]=r[2],r[2]=e;}this._radius=f.lenVec3(r),this._polar=Math.acos(r[1]/this._radius),this._azimuth=Math.atan2(r[0],r[2]),this._pivoting=!0;}_cameraLookingDownwards(){const e=this._scene.camera,t=f.normalizeVec3(f.subVec3(e.look,e.eye,RS)),s=f.cross3Vec3(t,e.worldUp,OS);return f.sqLenVec3(s)<=1e-4}getPivoting(){return this._pivoting}setPivotPos(e){this._pivotWorldPos.set(e),this._pivotPosSet=!0;}setCanvasPivotPos(e){const t=this._scene.camera,s=Math.abs(f.distVec3(this._scene.center,t.eye)),i=t.project.transposedMatrix,r=i.subarray(8,12),o=i.subarray(12),n=[0,0,-1,1],a=f.dotVec4(n,r)/f.dotVec4(n,o),h=NS;t.project.unproject(e,a,kS,jS,h);const l=f.normalizeVec3(f.subVec3(h,t.eye,RS)),u=f.addVec3(t.eye,f.mulVec3Scalar(l,s,OS),LS);this.setPivotPos(u);}getPivotPos(){return this._pivotPosSet?this._pivotWorldPos:this._scene.camera.look}continuePivot(e,t){if(!this._pivoting)return;if(0===e&&0===t)return;const s=this._scene.camera;var i=-e;const r=-t;1===s.worldUp[2]&&(i=-i),this._azimuth+=.01*-i,this._polar+=.01*r,this._polar=f.clamp(this._polar,.001,Math.PI-.001);const o=[this._radius*Math.sin(this._polar)*Math.sin(this._azimuth),this._radius*Math.cos(this._polar),this._radius*Math.sin(this._polar)*Math.cos(this._azimuth)];if(1===s.worldUp[2]){const e=o[1];o[1]=o[2],o[2]=e;}const n=f.lenVec3(f.subVec3(s.look,s.eye,f.vec3())),a=this.getPivotPos();f.addVec3(o,a);let h=f.lookAtMat4v(o,a,s.worldUp);h=f.inverseMat4(h);const l=f.transformVec3(h,this._cameraOffset);h[12]-=l[0],h[13]-=l[1],h[14]-=l[2];const u=[h[8],h[9],h[10]];s.eye=[h[12],h[13],h[14]],f.subVec3(s.eye,f.mulVec3Scalar(u,n),s.look),s.up=[h[4],h[5],h[6]],this.showPivot();}showPivot(){this._shown||(null!==this._hideTimeout&&(window.clearTimeout(this._hideTimeout),this._hideTimeout=null),this._pivotElement&&(this.updatePivotElement(),this._pivotElement.style.visibility="visible",this._shown=!0,this._hideTimeout=window.setTimeout((()=>{this.hidePivot();}),1e3)));}hidePivot(){this._shown&&(null!==this._hideTimeout&&(window.clearTimeout(this._hideTimeout),this._hideTimeout=null),this._pivotElement&&(this._pivotElement.style.visibility="hidden"),this._shown=!1);}endPivot(){this._pivoting=!1;}destroy(){this._scene.camera.off(this._onViewMatrix),this._scene.camera.off(this._onProjMatrix),this._scene.off(this._onTick);}}class HS{constructor(e,t){this._scene=e.scene,this._cameraControl=e,this._scene.canvas.canvas.oncontextmenu=function(e){e.preventDefault();},this._configs=t,this.schedulePickEntity=!1,this.schedulePickSurface=!1,this.pickCursorPos=f.vec2(),this.picked=!1,this.pickedSurface=!1,this.pickResult=null,this._lastPickedEntityId=null,this._needFireEvents=!1;}update(){if(!this._configs.pointerEnabled)return;if(!this.schedulePickEntity&&!this.schedulePickSurface)return;this.picked=!1,this.pickedSurface=!1,this._needFireEvents=!1;const e=this._cameraControl.hasSubs("hoverSurface");if(this.schedulePickSurface&&this.pickResult&&this.pickResult.worldPos){const t=this.pickResult.canvasPos;if(t[0]===this.pickCursorPos[0]&&t[1]===this.pickCursorPos[1])return this.picked=!0,this.pickedSurface=!0,this._needFireEvents=e,this.schedulePickEntity=!1,void(this.schedulePickSurface=!1)}if(this.schedulePickEntity&&this.pickResult){const e=this.pickResult.canvasPos;if(e[0]===this.pickCursorPos[0]&&e[1]===this.pickCursorPos[1])return this.picked=!0,this.pickedSurface=!1,this._needFireEvents=!1,this.schedulePickEntity=!1,void(this.schedulePickSurface=!1)}this.schedulePickSurface?(this.pickResult=this._scene.pick({pickSurface:!0,pickSurfaceNormal:!1,canvasPos:this.pickCursorPos}),this.pickResult&&(this.picked=!0,this.pickedSurface=!0,this._needFireEvents=!0)):(this.pickResult=this._scene.pick({canvasPos:this.pickCursorPos}),this.pickResult&&(this.picked=!0,this.pickedSurface=!1,this._needFireEvents=!0)),this.schedulePickEntity=!1,this.schedulePickSurface=!1;}fireEvents(){if(this._needFireEvents){if(this.picked&&this.pickResult&&this.pickResult.entity){const e=this.pickResult.entity.id;this._lastPickedEntityId!==e&&(void 0!==this._lastPickedEntityId&&this._cameraControl.fire("hoverOut",{entity:this._scene.objects[this._lastPickedEntityId]},!0),this._cameraControl.fire("hoverEnter",this.pickResult,!0),this._lastPickedEntityId=e),this._cameraControl.fire("hover",this.pickResult,!0),this.pickResult.worldPos&&(this.pickedSurface=!0,this._cameraControl.fire("hoverSurface",this.pickResult,!0));}else void 0!==this._lastPickedEntityId&&(this._cameraControl.fire("hoverOut",{entity:this._scene.objects[this._lastPickedEntityId]},!0),this._lastPickedEntityId=void 0),this._cameraControl.fire("hoverOff",{canvasPos:this.pickCursorPos},!0);this.pickResult=null,this._needFireEvents=!1;}}destroy(){}}const VS=f.vec2();class US{constructor(e,t,s,i,r){this._scene=e;const o=t.pickController;let n,a,h,l=0,u=0,c=0,p=0,d=!1;const m=f.vec3();let g=!0;const _=this._scene.canvas.canvas,y=[];function v(e=!0){_.style.cursor="move",l=i.pointerCanvasPos[0],u=i.pointerCanvasPos[1],c=i.pointerCanvasPos[0],p=i.pointerCanvasPos[1],e&&(o.pickCursorPos=i.pointerCanvasPos,o.schedulePickSurface=!0,o.update(),o.picked&&o.pickedSurface&&o.pickResult&&o.pickResult.worldPos?(d=!0,m.set(o.pickResult.worldPos)):d=!1);}document.addEventListener("keydown",this._documentKeyDownHandler=t=>{if(!s.active||!s.pointerEnabled||!e.input.keyboardEnabled)return;const i=t.keyCode;y[i]=!0;}),document.addEventListener("keyup",this._documentKeyUpHandler=t=>{if(!s.active||!s.pointerEnabled||!e.input.keyboardEnabled)return;const i=t.keyCode;y[i]=!1;}),_.addEventListener("mousedown",this._mouseDownHandler=t=>{if(s.active&&s.pointerEnabled)switch(t.which){case 1:y[e.input.KEY_SHIFT]||s.planView?(n=!0,v()):(n=!0,v(!1));break;case 2:a=!0,v();break;case 3:h=!0,s.panRightClick&&v();}}),document.addEventListener("mousemove",this._documentMouseMoveHandler=()=>{if(!s.active||!s.pointerEnabled)return;if(!n&&!a&&!h)return;const t=e.canvas.boundary,o=t[2]-t[0],c=t[3]-t[1],p=i.pointerCanvasPos[0],g=i.pointerCanvasPos[1];if(y[e.input.KEY_SHIFT]||s.planView||!s.panRightClick&&a||s.panRightClick&&h){const t=p-l,s=g-u,i=e.camera;if("perspective"===i.projection){const o=Math.abs(d?f.lenVec3(f.subVec3(m,e.camera.eye,[])):e.camera.eyeLookDist)*Math.tan(i.perspective.fov/2*Math.PI/180);r.panDeltaX+=1.5*t*o/c,r.panDeltaY+=1.5*s*o/c;}else r.panDeltaX+=.5*i.ortho.scale*(t/c),r.panDeltaY+=.5*i.ortho.scale*(s/c);}else !n||a||h||s.planView||(s.firstPerson?(r.rotateDeltaY-=(p-l)/o*s.dragRotationRate/2,r.rotateDeltaX+=(g-u)/c*(s.dragRotationRate/4)):(r.rotateDeltaY-=(p-l)/o*(1.5*s.dragRotationRate),r.rotateDeltaX+=(g-u)/c*(1.5*s.dragRotationRate)));l=p,u=g;}),_.addEventListener("mousemove",this._canvasMouseMoveHandler=e=>{s.active&&s.pointerEnabled&&i.mouseover&&(g=!0);}),document.addEventListener("mouseup",this._documentMouseUpHandler=e=>{if(s.active&&s.pointerEnabled)switch(e.which){case 1:case 2:case 3:n=!1,a=!1,h=!1;}}),_.addEventListener("mouseup",this._mouseUpHandler=e=>{if(s.active&&s.pointerEnabled){if(3===e.which){!function(e,t){if(e){let s=e.target,i=0,r=0;for(;s.offsetParent;)i+=s.offsetLeft,r+=s.offsetTop,s=s.offsetParent;t[0]=e.pageX-i,t[1]=e.pageY-r;}else e=window.event,t[0]=e.x,t[1]=e.y;}(e,VS);const s=VS[0],i=VS[1];Math.abs(s-c)<3&&Math.abs(i-p)<3&&t.cameraControl.fire("rightClick",{pagePos:[Math.round(e.pageX),Math.round(e.pageY)],canvasPos:VS,event:e},!0);}_.style.removeProperty("cursor");}}),_.addEventListener("mouseenter",this._mouseEnterHandler=()=>{s.active&&s.pointerEnabled;});const b=1/60;let w=null;_.addEventListener("wheel",this._mouseWheelHandler=e=>{if(!s.active||!s.pointerEnabled)return;const t=performance.now()/1e3;var o=null!==w?t-w:0;w=t,o>.05&&(o=.05),o<b&&(o=b);const n=Math.max(-1,Math.min(1,40*-e.deltaY));if(0===n)return;const a=n/Math.abs(n);r.dollyDelta+=-a*o*s.mouseWheelDollyRate,g&&(i.followPointerDirty=!0,g=!1);},{passive:!0});}reset(){}destroy(){const e=this._scene.canvas.canvas;document.removeEventListener("keydown",this._documentKeyDownHandler),document.removeEventListener("keyup",this._documentKeyUpHandler),e.removeEventListener("mousedown",this._mouseDownHandler),document.removeEventListener("mousemove",this._documentMouseMoveHandler),e.removeEventListener("mousemove",this._canvasMouseMoveHandler),document.removeEventListener("mouseup",this._documentMouseUpHandler),e.removeEventListener("mouseup",this._mouseUpHandler),e.removeEventListener("mouseenter",this._mouseEnterHandler),e.removeEventListener("wheel",this._mouseWheelHandler);}}const zS=f.vec3(),WS=f.vec3(),XS=f.vec3(),YS=f.vec3(),KS=f.vec3(),JS={eye:f.vec3(),look:f.vec3(),up:f.vec3()};class ZS{constructor(e,t,s,i){this._scene=e;const r=t.cameraControl,o=e.camera;this._onSceneKeyDown=e.input.on("keydown",(()=>{if(!s.active||!s.pointerEnabled||!e.input.keyboardEnabled)return;if(!i.mouseover)return;const n=r._isKeyDownForAction(r.AXIS_VIEW_RIGHT),a=r._isKeyDownForAction(r.AXIS_VIEW_BACK),h=r._isKeyDownForAction(r.AXIS_VIEW_LEFT),l=r._isKeyDownForAction(r.AXIS_VIEW_FRONT),u=r._isKeyDownForAction(r.AXIS_VIEW_TOP),c=r._isKeyDownForAction(r.AXIS_VIEW_BOTTOM);if(!(n||a||h||l||u||c))return;const p=e.aabb,d=f.getAABB3Diag(p);f.getAABB3Center(p,zS);const m=Math.abs(d/Math.tan(t.cameraFlight.fitFOV*f.DEGTORAD)),g=1.1*d;JS.orthoScale=g,n?(JS.eye.set(f.addVec3(zS,f.mulVec3Scalar(o.worldRight,m,WS),KS)),JS.look.set(zS),JS.up.set(o.worldUp)):a?(JS.eye.set(f.addVec3(zS,f.mulVec3Scalar(o.worldForward,m,WS),KS)),JS.look.set(zS),JS.up.set(o.worldUp)):h?(JS.eye.set(f.addVec3(zS,f.mulVec3Scalar(o.worldRight,-m,WS),KS)),JS.look.set(zS),JS.up.set(o.worldUp)):l?(JS.eye.set(f.addVec3(zS,f.mulVec3Scalar(o.worldForward,-m,WS),KS)),JS.look.set(zS),JS.up.set(o.worldUp)):u?(JS.eye.set(f.addVec3(zS,f.mulVec3Scalar(o.worldUp,m,WS),KS)),JS.look.set(zS),JS.up.set(f.normalizeVec3(f.mulVec3Scalar(o.worldForward,1,XS),YS))):c&&(JS.eye.set(f.addVec3(zS,f.mulVec3Scalar(o.worldUp,-m,WS),KS)),JS.look.set(zS),JS.up.set(f.normalizeVec3(f.mulVec3Scalar(o.worldForward,-1,XS)))),!s.firstPerson&&s.followPointer&&t.pivotController.setPivotPos(zS),t.cameraFlight.duration>0?t.cameraFlight.flyTo(JS,(()=>{t.pivotController.getPivoting()&&s.followPointer&&t.pivotController.showPivot();})):(t.cameraFlight.jumpTo(JS),t.pivotController.getPivoting()&&s.followPointer&&t.pivotController.showPivot());}));}reset(){}destroy(){this._scene.input.off(this._onSceneKeyDown);}}class QS{constructor(e,t,s,i,r){this._scene=e;const o=t.pickController,n=t.pivotController,a=t.cameraControl;this._clicks=0,this._timeout=null,this._lastPickedEntityId=null;let h=!1,l=!1;const u=this._scene.canvas.canvas,c=s=>{let i;s&&s.worldPos&&(i=s.worldPos);const r=s&&s.entity?s.entity.aabb:e.aabb;if(i){const s=e.camera;f.subVec3(s.eye,s.look,[]),t.cameraFlight.flyTo({aabb:r});}else t.cameraFlight.flyTo({aabb:r});};u.addEventListener("mousemove",this._canvasMouseMoveHandler=t=>{if(!s.active||!s.pointerEnabled)return;if(h||l)return;const r=a.hasSubs("hover"),n=a.hasSubs("hoverOut"),u=a.hasSubs("hoverOff"),c=a.hasSubs("hoverSurface");if(r||n||u||c)if(o.pickCursorPos=i.pointerCanvasPos,o.schedulePickEntity=!0,o.schedulePickSurface=c,o.update(),o.pickResult){const t=o.pickResult.entity.id;this._lastPickedEntityId!==t&&(void 0!==this._lastPickedEntityId&&a.fire("hoverOut",{entity:e.objects[this._lastPickedEntityId]},!0),a.fire("hoverEnter",o.pickResult,!0),this._lastPickedEntityId=t),a.fire("hover",o.pickResult,!0),o.pickResult.worldPos&&a.fire("hoverSurface",o.pickResult,!0);}else void 0!==this._lastPickedEntityId&&(a.fire("hoverOut",{entity:e.objects[this._lastPickedEntityId]},!0),this._lastPickedEntityId=void 0),a.fire("hoverOff",{canvasPos:o.pickCursorPos},!0);}),u.addEventListener("mousedown",this._canvasMouseDownHandler=t=>{1===t.which&&(h=!0),3===t.which&&(l=!0);if(1===t.which&&s.active&&s.pointerEnabled&&(i.mouseDownClientX=t.clientX,i.mouseDownClientY=t.clientY,i.mouseDownCursorX=i.pointerCanvasPos[0],i.mouseDownCursorY=i.pointerCanvasPos[1],!s.firstPerson&&s.followPointer&&(o.pickCursorPos=i.pointerCanvasPos,o.schedulePickSurface=!0,o.update(),1===t.which))){const t=o.pickResult;t&&t.worldPos?(n.setPivotPos(t.worldPos),n.startPivot()):(s.smartPivot?n.setCanvasPivotPos(i.pointerCanvasPos):n.setPivotPos(e.camera.look),n.startPivot());}}),document.addEventListener("mouseup",this._documentMouseUpHandler=e=>{1===e.which&&(h=!1),3===e.which&&(l=!1);}),u.addEventListener("mouseup",this._canvasMouseUpHandler=r=>{if(!s.active||!s.pointerEnabled)return;if(!(1===r.which))return;if(n.hidePivot(),Math.abs(r.clientX-i.mouseDownClientX)>3||Math.abs(r.clientY-i.mouseDownClientY)>3)return;const h=a.hasSubs("picked"),l=a.hasSubs("pickedNothing"),u=a.hasSubs("pickedSurface"),p=a.hasSubs("doublePicked"),d=a.hasSubs("doublePickedSurface"),m=a.hasSubs("doublePickedNothing");if(!(s.doublePickFlyTo||p||d||m))return (h||l||u)&&(o.pickCursorPos=i.pointerCanvasPos,o.schedulePickEntity=!0,o.schedulePickSurface=u,o.update(),o.pickResult?(a.fire("picked",o.pickResult,!0),o.pickedSurface&&a.fire("pickedSurface",o.pickResult,!0)):a.fire("pickedNothing",{canvasPos:i.pointerCanvasPos},!0)),void(this._clicks=0);if(this._clicks++,1===this._clicks){o.pickCursorPos=i.pointerCanvasPos,o.schedulePickEntity=s.doublePickFlyTo,o.schedulePickSurface=u,o.update();const e=o.pickResult,r=o.pickedSurface;this._timeout=setTimeout((()=>{e?(a.fire("picked",e,!0),r&&(a.fire("pickedSurface",e,!0),!s.firstPerson&&s.followPointer&&(t.pivotController.setPivotPos(e.worldPos),t.pivotController.startPivot()&&t.pivotController.showPivot()))):a.fire("pickedNothing",{canvasPos:i.pointerCanvasPos},!0),this._clicks=0;}),s.doubleClickTimeFrame);}else {if(null!==this._timeout&&(window.clearTimeout(this._timeout),this._timeout=null),o.pickCursorPos=i.pointerCanvasPos,o.schedulePickEntity=s.doublePickFlyTo||p||d,o.schedulePickSurface=o.schedulePickEntity&&d,o.update(),o.pickResult){if(a.fire("doublePicked",o.pickResult,!0),o.pickedSurface&&a.fire("doublePickedSurface",o.pickResult,!0),s.doublePickFlyTo&&(c(o.pickResult),!s.firstPerson&&s.followPointer)){const e=o.pickResult.entity.aabb,s=f.getAABB3Center(e);t.pivotController.setPivotPos(s),t.pivotController.startPivot()&&t.pivotController.showPivot();}}else if(a.fire("doublePickedNothing",{canvasPos:i.pointerCanvasPos},!0),s.doublePickFlyTo&&(c(),!s.firstPerson&&s.followPointer)){const s=e.aabb,i=f.getAABB3Center(s);t.pivotController.setPivotPos(i),t.pivotController.startPivot()&&t.pivotController.showPivot();}this._clicks=0;}},!1);}reset(){this._clicks=0,this._lastPickedEntityId=null,this._timeout&&(window.clearTimeout(this._timeout),this._timeout=null);}destroy(){const e=this._scene.canvas.canvas;e.removeEventListener("mousemove",this._canvasMouseMoveHandler),e.removeEventListener("mousedown",this._canvasMouseDownHandler),document.removeEventListener("mouseup",this._documentMouseUpHandler),e.removeEventListener("mouseup",this._canvasMouseUpHandler),this._timeout&&(window.clearTimeout(this._timeout),this._timeout=null);}}class qS{constructor(e,t,s,i,r){this._scene=e;const o=e.input,n=[],a=e.canvas.canvas;let h=!0;this._onSceneMouseMove=o.on("mousemove",(()=>{h=!0;})),this._onSceneKeyDown=o.on("keydown",(t=>{s.active&&s.pointerEnabled&&e.input.keyboardEnabled&&i.mouseover&&(n[t]=!0,t===o.KEY_SHIFT&&(a.style.cursor="move"));})),this._onSceneKeyUp=o.on("keyup",(t=>{s.active&&s.pointerEnabled&&e.input.keyboardEnabled&&i.mouseover&&(n[t]=!1,t===o.KEY_SHIFT&&(a.style.cursor=null));})),this._onTick=e.on("tick",(a=>{if(!s.active||!s.pointerEnabled||!e.input.keyboardEnabled)return;if(!i.mouseover)return;const l=t.cameraControl,u=a.deltaTime/1e3;if(!s.planView){const e=l._isKeyDownForAction(l.ROTATE_Y_POS,n),i=l._isKeyDownForAction(l.ROTATE_Y_NEG,n),o=l._isKeyDownForAction(l.ROTATE_X_POS,n),a=l._isKeyDownForAction(l.ROTATE_X_NEG,n),h=u*s.keyboardRotationRate;(e||i||o||a)&&(!s.firstPerson&&s.followPointer&&t.pivotController.startPivot(),e?r.rotateDeltaY+=h:i&&(r.rotateDeltaY-=h),o?r.rotateDeltaX+=h:a&&(r.rotateDeltaX-=h),!s.firstPerson&&s.followPointer&&t.pivotController.startPivot());}if(!n[o.KEY_CTRL]&&!n[o.KEY_ALT]){const e=l._isKeyDownForAction(l.DOLLY_BACKWARDS,n),o=l._isKeyDownForAction(l.DOLLY_FORWARDS,n);if(e||o){const n=u*s.keyboardDollyRate;!s.firstPerson&&s.followPointer&&t.pivotController.startPivot(),o?r.dollyDelta-=n:e&&(r.dollyDelta+=n),h&&(i.followPointerDirty=!0,h=!1);}}const c=l._isKeyDownForAction(l.PAN_FORWARDS,n),p=l._isKeyDownForAction(l.PAN_BACKWARDS,n),d=l._isKeyDownForAction(l.PAN_LEFT,n),f=l._isKeyDownForAction(l.PAN_RIGHT,n),m=l._isKeyDownForAction(l.PAN_UP,n),g=l._isKeyDownForAction(l.PAN_DOWN,n),_=(n[o.KEY_ALT]?.3:1)*u*s.keyboardPanRate;(c||p||d||f||m||g)&&(!s.firstPerson&&s.followPointer&&t.pivotController.startPivot(),g?r.panDeltaY+=_:m&&(r.panDeltaY+=-_),f?r.panDeltaX+=-_:d&&(r.panDeltaX+=_),p?r.panDeltaZ+=_:c&&(r.panDeltaZ+=-_));}));}reset(){}destroy(){this._scene.off(this._onTick),this._scene.input.off(this._onSceneMouseMove),this._scene.input.off(this._onSceneKeyDown),this._scene.input.off(this._onSceneKeyUp);}}const $S=f.vec3();class eR{constructor(e,t,s,i,r){this._scene=e;const o=e.camera,n=t.pickController,a=t.pivotController,h=t.panController;let l=1,u=1,c=null;this._onTick=e.on("tick",(()=>{if(!s.active||!s.pointerEnabled)return;let t="default";if(Math.abs(r.dollyDelta)<.001&&(r.dollyDelta=0),Math.abs(r.rotateDeltaX)<.001&&(r.rotateDeltaX=0),Math.abs(r.rotateDeltaY)<.001&&(r.rotateDeltaY=0),0===r.rotateDeltaX&&0===r.rotateDeltaY||(r.dollyDelta=0),s.followPointer&&--l<=0&&(l=1,0!==r.dollyDelta)){if(0===r.rotateDeltaY&&0===r.rotateDeltaX&&s.followPointer&&i.followPointerDirty&&(n.pickCursorPos=i.pointerCanvasPos,n.schedulePickSurface=!0,n.update(),n.pickResult&&n.pickResult.worldPos?c=n.pickResult.worldPos:(u=1,c=null),i.followPointerDirty=!1),c){const t=Math.abs(f.lenVec3(f.subVec3(c,e.camera.eye,$S)));u=t/s.dollyProximityThreshold;}u<s.dollyMinSpeed&&(u=s.dollyMinSpeed);}const p=r.dollyDelta*u;if(0===r.rotateDeltaY&&0===r.rotateDeltaX||(!s.firstPerson&&s.followPointer&&a.getPivoting()?(a.continuePivot(r.rotateDeltaY,r.rotateDeltaX),a.showPivot()):(0!==r.rotateDeltaX&&(s.firstPerson?o.pitch(-r.rotateDeltaX):o.orbitPitch(r.rotateDeltaX)),0!==r.rotateDeltaY&&(s.firstPerson?o.yaw(r.rotateDeltaY):o.orbitYaw(r.rotateDeltaY))),r.rotateDeltaX*=s.rotationInertia,r.rotateDeltaY*=s.rotationInertia,t="grabbing"),Math.abs(r.panDeltaX)<.001&&(r.panDeltaX=0),Math.abs(r.panDeltaY)<.001&&(r.panDeltaY=0),Math.abs(r.panDeltaZ)<.001&&(r.panDeltaZ=0),0!==r.panDeltaX||0!==r.panDeltaY||0!==r.panDeltaZ){const e=f.vec3();let i,n;if(e[0]=r.panDeltaX,e[1]=r.panDeltaY,e[2]=r.panDeltaZ,s.constrainVertical){o.xUp?(i=o.eye[0],n=o.look[0]):o.yUp?(i=o.eye[1],n=o.look[1]):o.zUp&&(i=o.eye[2],n=o.look[2]),o.pan(e);const t=o.eye,s=o.look;o.xUp?(t[0]=i,s[0]=n):o.yUp?(t[1]=i,s[1]=n):o.zUp&&(t[2]=i,s[2]=n),o.eye=t,o.look=s;}else o.pan(e);t="grabbing";}if(r.panDeltaX*=s.panInertia,r.panDeltaY*=s.panInertia,r.panDeltaZ*=s.panInertia,0!==p){if(t=p<0?"zoom-in":"zoom-out",s.firstPerson){let e,t;if(s.constrainVertical&&(o.xUp?(e=o.eye[0],t=o.look[0]):o.yUp?(e=o.eye[1],t=o.look[1]):o.zUp&&(e=o.eye[2],t=o.look[2])),s.followPointer){h.dollyToCanvasPos(c,i.pointerCanvasPos,-p)&&(i.followPointerDirty=!0);}else o.pan([0,0,p]),o.ortho.scale=o.ortho.scale-p;if(s.constrainVertical){const s=o.eye,i=o.look;o.xUp?(s[0]=e,i[0]=t):o.yUp?(s[1]=e,i[1]=t):o.zUp&&(s[2]=e,i[2]=t),o.eye=s,o.look=i;}}else if(s.planView)if(s.followPointer){h.dollyToCanvasPos(c,i.pointerCanvasPos,-p)&&(i.followPointerDirty=!0);}else o.ortho.scale=o.ortho.scale+p,o.zoom(p);else if(s.followPointer){h.dollyToCanvasPos(c,i.pointerCanvasPos,-p)&&(i.followPointerDirty=!0);}else o.ortho.scale=o.ortho.scale+p,o.zoom(p);r.dollyDelta*=s.dollyInertia;}n.fireEvents(),document.body.style.cursor=t;}));}destroy(){this._scene.off(this._onTick);}}class tR{constructor(e,t,s,i,r){this._scene=e;const o=this._scene.canvas.canvas;o.addEventListener("mouseenter",this._mouseEnterHandler=()=>{i.mouseover=!0;}),o.addEventListener("mouseleave",this._mouseLeaveHandler=()=>{i.mouseover=!1,o.style.cursor=null;}),document.addEventListener("mousemove",this._mouseMoveHandler=e=>{sR(e,o,i.pointerCanvasPos);}),o.addEventListener("mousedown",this._mouseDownHandler=e=>{s.active&&s.pointerEnabled&&(sR(e,o,i.pointerCanvasPos),i.mouseover=!0);}),o.addEventListener("mouseup",this._mouseUpHandler=e=>{s.active&&s.pointerEnabled;});}reset(){}destroy(){const e=this._scene.canvas.canvas;document.removeEventListener("mousemove",this._mouseMoveHandler),e.removeEventListener("mouseenter",this._mouseEnterHandler),e.removeEventListener("mouseleave",this._mouseLeaveHandler),e.removeEventListener("mousedown",this._mouseDownHandler),e.removeEventListener("mouseup",this._mouseUpHandler);}}function sR(e,t,s){if(e){const{x:i,y:r}=t.getBoundingClientRect();s[0]=e.clientX-i,s[1]=e.clientY-r;}else e=window.event,s[0]=e.x,s[1]=e.y;return s}const iR=function(e,t){if(e){let s=e.target,i=0,r=0;for(;s.offsetParent;)i+=s.offsetLeft,r+=s.offsetTop,s=s.offsetParent;t[0]=e.pageX-i,t[1]=e.pageY-r;}else e=window.event,t[0]=e.x,t[1]=e.y;return t};class rR{constructor(e,t,s,i,r){this._scene=e;const o=t.pickController,n=t.pivotController,a=f.vec2(),h=f.vec2(),l=f.vec2(),u=f.vec2(),c=[],p=this._scene.canvas.canvas;let d=0,m=!1;this._onTick=e.on("tick",(()=>{m=!1;})),p.addEventListener("touchstart",this._canvasTouchStartHandler=t=>{if(!s.active||!s.pointerEnabled)return;t.preventDefault();const r=t.touches,h=t.changedTouches;for(i.touchStartTime=Date.now(),1===r.length&&1===h.length&&(iR(r[0],a),s.followPointer&&(o.pickCursorPos=a,o.schedulePickSurface=!0,o.update(),s.planView||(o.picked&&o.pickedSurface&&o.pickResult&&o.pickResult.worldPos?(n.setPivotPos(o.pickResult.worldPos),!s.firstPerson&&n.startPivot()&&n.showPivot()):(s.smartPivot?n.setCanvasPivotPos(i.pointerCanvasPos):n.setPivotPos(e.camera.look),!s.firstPerson&&n.startPivot()&&n.showPivot()))));c.length<r.length;)c.push(f.vec2());for(let e=0,t=r.length;e<t;++e)iR(r[e],c[e]);d=r.length;}),p.addEventListener("touchmove",this._canvasTouchMoveHandler=t=>{if(!s.active||!s.pointerEnabled)return;if(t.stopPropagation(),t.preventDefault(),m)return;m=!0;const n=e.canvas.boundary,a=n[2]-n[0],p=n[3]-n[1],g=t.touches;if(t.touches.length===d){if(1===d){iR(g[0],h),f.subVec2(h,c[0],u);const t=u[0],o=u[1];if(null!==i.longTouchTimeout&&(Math.abs(t)>s.longTapRadius||Math.abs(o)>s.longTapRadius)&&(clearTimeout(i.longTouchTimeout),i.longTouchTimeout=null),s.planView){const i=e.camera;if("perspective"===i.projection){const n=Math.abs(e.camera.eyeLookDist)*Math.tan(i.perspective.fov/2*Math.PI/180);r.panDeltaX+=t*n/p*s.touchPanRate,r.panDeltaY+=o*n/p*s.touchPanRate;}else r.panDeltaX+=.5*i.ortho.scale*(t/p)*s.touchPanRate,r.panDeltaY+=.5*i.ortho.scale*(o/p)*s.touchPanRate;}else r.rotateDeltaY-=t/a*(1*s.dragRotationRate),r.rotateDeltaX+=o/p*(1.5*s.dragRotationRate);}else if(2===d){const t=g[0],n=g[1];iR(t,h),iR(n,l);const a=f.geometricMeanVec2(c[0],c[1]),u=f.geometricMeanVec2(h,l),d=f.vec2();f.subVec2(a,u,d);const m=d[0],_=d[1],y=e.camera,v=f.distVec2([t.pageX,t.pageY],[n.pageX,n.pageY]),b=(f.distVec2(c[0],c[1])-v)*s.touchDollyRate;if(r.dollyDelta=b,Math.abs(b)<1)if("perspective"===y.projection){const t=o.pickResult?o.pickResult.worldPos:e.center,i=Math.abs(f.lenVec3(f.subVec3(t,e.camera.eye,[])))*Math.tan(y.perspective.fov/2*Math.PI/180);r.panDeltaX-=m*i/p*s.touchPanRate,r.panDeltaY-=_*i/p*s.touchPanRate;}else r.panDeltaX-=.5*y.ortho.scale*(m/p)*s.touchPanRate,r.panDeltaY-=.5*y.ortho.scale*(_/p)*s.touchPanRate;i.pointerCanvasPos=u;}for(let e=0;e<d;++e)iR(g[e],c[e]);}});}reset(){}destroy(){const e=this._scene.canvas.canvas;e.removeEventListener("touchstart",this._canvasTouchStartHandler),e.removeEventListener("touchmove",this._canvasTouchMoveHandler),this._scene.off(this._onTick);}}const oR=function(e,t){if(e){let s=e.target,i=0,r=0;for(;s.offsetParent;)i+=s.offsetLeft,r+=s.offsetTop,s=s.offsetParent;t[0]=e.pageX-i,t[1]=e.pageY-r;}else e=window.event,t[0]=e.x,t[1]=e.y;return t};class nR{constructor(e,t,s,i,r){this._scene=e;const o=t.pickController,n=t.cameraControl;let a;const h=[],l=new Float32Array(2);let u=-1,c=-1;const p=this._scene.canvas.canvas,d=s=>{let i;s&&s.worldPos&&(i=s.worldPos);const r=s?s.entity.aabb:e.aabb;if(i){const s=e.camera;f.subVec3(s.eye,s.look,[]),t.cameraFlight.flyTo({aabb:r});}else t.cameraFlight.flyTo({aabb:r});};p.addEventListener("touchstart",this._canvasTouchStartHandler=e=>{if(!s.active||!s.pointerEnabled)return;null!==i.longTouchTimeout&&(clearTimeout(i.longTouchTimeout),i.longTouchTimeout=null);const r=e.touches,o=e.changedTouches;if(a=Date.now(),1===r.length&&1===o.length){u=a,oR(r[0],l);const o=l[0],n=l[1],h=r[0].pageX,c=r[0].pageY;i.longTouchTimeout=setTimeout((()=>{t.cameraControl.fire("rightClick",{pagePos:[Math.round(h),Math.round(c)],canvasPos:[Math.round(o),Math.round(n)],event:e},!0),i.longTouchTimeout=null;}),s.longTapTimeout);}else u=-1;for(;h.length<r.length;)h.push(new Float32Array(2));for(let e=0,t=r.length;e<t;++e)oR(r[e],h[e]);h.length=r.length;},{passive:!0}),p.addEventListener("touchend",this._canvasTouchEndHandler=e=>{if(!s.active||!s.pointerEnabled)return;const t=Date.now(),r=e.touches,a=e.changedTouches,p=n.hasSubs("pickedSurface");null!==i.longTouchTimeout&&(clearTimeout(i.longTouchTimeout),i.longTouchTimeout=null),0===r.length&&1===a.length&&u>-1&&t-u<150&&(c>-1&&u-c<325?(oR(a[0],o.pickCursorPos),o.schedulePickEntity=!0,o.schedulePickSurface=p,o.update(),o.pickResult?(n.fire("doublePicked",o.pickResult),o.pickedSurface&&n.fire("doublePickedSurface",o.pickResult),s.doublePickFlyTo&&d(o.pickResult)):(n.fire("doublePickedNothing"),s.doublePickFlyTo&&d()),c=-1):f.distVec2(h[0],l)<4&&(oR(a[0],o.pickCursorPos),o.schedulePickEntity=!0,o.schedulePickSurface=p,o.update(),o.pickResult?(n.fire("picked",o.pickResult),o.pickedSurface&&n.fire("pickedSurface",o.pickResult)):n.fire("pickedNothing"),c=t),u=-1),h.length=r.length;for(let e=0,t=r.length;e<t;++e)h[e][0]=r[e].pageX,h[e][1]=r[e].pageY;e.stopPropagation();},{passive:!0});}reset(){}destroy(){const e=this._scene.canvas.canvas;e.removeEventListener("touchstart",this._canvasTouchStartHandler),e.removeEventListener("touchend",this._canvasTouchEndHandler);}}class aR extends B{constructor(e,t={}){super(e,t),this.PAN_LEFT=0,this.PAN_RIGHT=1,this.PAN_UP=2,this.PAN_DOWN=3,this.PAN_FORWARDS=4,this.PAN_BACKWARDS=5,this.ROTATE_X_POS=6,this.ROTATE_X_NEG=7,this.ROTATE_Y_POS=8,this.ROTATE_Y_NEG=9,this.DOLLY_FORWARDS=10,this.DOLLY_BACKWARDS=11,this.AXIS_VIEW_RIGHT=12,this.AXIS_VIEW_BACK=13,this.AXIS_VIEW_LEFT=14,this.AXIS_VIEW_FRONT=15,this.AXIS_VIEW_TOP=16,this.AXIS_VIEW_BOTTOM=17,this._keyMap={},this.scene.canvas.canvas.oncontextmenu=e=>{e.preventDefault();},this._configs={longTapTimeout:600,longTapRadius:5,active:!0,keyboardLayout:"qwerty",navMode:"orbit",planView:!1,firstPerson:!1,followPointer:!0,doublePickFlyTo:!0,panRightClick:!0,showPivot:!1,pointerEnabled:!0,constrainVertical:!1,smartPivot:!1,doubleClickTimeFrame:250,dragRotationRate:360,keyboardRotationRate:90,rotationInertia:0,keyboardPanRate:1,touchPanRate:1,panInertia:.5,keyboardDollyRate:10,mouseWheelDollyRate:100,touchDollyRate:.2,dollyInertia:0,dollyProximityThreshold:30,dollyMinSpeed:.04},this._states={pointerCanvasPos:f.vec2(),mouseover:!1,followPointerDirty:!0,mouseDownClientX:0,mouseDownClientY:0,mouseDownCursorX:0,mouseDownCursorY:0,touchStartTime:null,activeTouches:[],tapStartPos:f.vec2(),tapStartTime:-1,lastTapTime:-1,longTouchTimeout:null},this._updates={rotateDeltaX:0,rotateDeltaY:0,panDeltaX:0,panDeltaY:0,panDeltaZ:0,dollyDelta:0};const s=this.scene;this._controllers={cameraControl:this,pickController:new HS(this,this._configs),pivotController:new GS(s,this._configs),panController:new SS(s),cameraFlight:new QE(this,{duration:.5})},this._handlers=[new tR(this.scene,this._controllers,this._configs,this._states,this._updates),new rR(this.scene,this._controllers,this._configs,this._states,this._updates),new US(this.scene,this._controllers,this._configs,this._states,this._updates),new ZS(this.scene,this._controllers,this._configs,this._states,this._updates),new QS(this.scene,this._controllers,this._configs,this._states,this._updates),new nR(this.scene,this._controllers,this._configs,this._states,this._updates),new qS(this.scene,this._controllers,this._configs,this._states,this._updates)],this._cameraUpdater=new eR(this.scene,this._controllers,this._configs,this._states,this._updates),this.navMode=t.navMode,t.planView&&(this.planView=t.planView),this.constrainVertical=t.constrainVertical,t.keyboardLayout?this.keyboardLayout=t.keyboardLayout:this.keyMap=t.keyMap,this.doublePickFlyTo=t.doublePickFlyTo,this.panRightClick=t.panRightClick,this.active=t.active,this.followPointer=t.followPointer,this.rotationInertia=t.rotationInertia,this.keyboardPanRate=t.keyboardPanRate,this.touchPanRate=t.touchPanRate,this.keyboardRotationRate=t.keyboardRotationRate,this.dragRotationRate=t.dragRotationRate,this.touchDollyRate=t.touchDollyRate,this.dollyInertia=t.dollyInertia,this.dollyProximityThreshold=t.dollyProximityThreshold,this.dollyMinSpeed=t.dollyMinSpeed,this.panInertia=t.panInertia,this.pointerEnabled=!0,this.keyboardDollyRate=t.keyboardDollyRate,this.mouseWheelDollyRate=t.mouseWheelDollyRate;}set keyMap(e){if(e=e||"qwerty",b.isString(e)){const t=this.scene.input,s={};switch(e){default:this.error("Unsupported value for 'keyMap': "+e+" defaulting to 'qwerty'");case"qwerty":s[this.PAN_LEFT]=[t.KEY_A],s[this.PAN_RIGHT]=[t.KEY_D],s[this.PAN_UP]=[t.KEY_Z],s[this.PAN_DOWN]=[t.KEY_X],s[this.PAN_BACKWARDS]=[],s[this.PAN_FORWARDS]=[],s[this.DOLLY_FORWARDS]=[t.KEY_W,t.KEY_ADD],s[this.DOLLY_BACKWARDS]=[t.KEY_S,t.KEY_SUBTRACT],s[this.ROTATE_X_POS]=[t.KEY_DOWN_ARROW],s[this.ROTATE_X_NEG]=[t.KEY_UP_ARROW],s[this.ROTATE_Y_POS]=[t.KEY_Q,t.KEY_LEFT_ARROW],s[this.ROTATE_Y_NEG]=[t.KEY_E,t.KEY_RIGHT_ARROW],s[this.AXIS_VIEW_RIGHT]=[t.KEY_NUM_1],s[this.AXIS_VIEW_BACK]=[t.KEY_NUM_2],s[this.AXIS_VIEW_LEFT]=[t.KEY_NUM_3],s[this.AXIS_VIEW_FRONT]=[t.KEY_NUM_4],s[this.AXIS_VIEW_TOP]=[t.KEY_NUM_5],s[this.AXIS_VIEW_BOTTOM]=[t.KEY_NUM_6];break;case"azerty":s[this.PAN_LEFT]=[t.KEY_Q],s[this.PAN_RIGHT]=[t.KEY_D],s[this.PAN_UP]=[t.KEY_W],s[this.PAN_DOWN]=[t.KEY_X],s[this.PAN_BACKWARDS]=[],s[this.PAN_FORWARDS]=[],s[this.DOLLY_FORWARDS]=[t.KEY_Z,t.KEY_ADD],s[this.DOLLY_BACKWARDS]=[t.KEY_S,t.KEY_SUBTRACT],s[this.ROTATE_X_POS]=[t.KEY_DOWN_ARROW],s[this.ROTATE_X_NEG]=[t.KEY_UP_ARROW],s[this.ROTATE_Y_POS]=[t.KEY_A,t.KEY_LEFT_ARROW],s[this.ROTATE_Y_NEG]=[t.KEY_E,t.KEY_RIGHT_ARROW],s[this.AXIS_VIEW_RIGHT]=[t.KEY_NUM_1],s[this.AXIS_VIEW_BACK]=[t.KEY_NUM_2],s[this.AXIS_VIEW_LEFT]=[t.KEY_NUM_3],s[this.AXIS_VIEW_FRONT]=[t.KEY_NUM_4],s[this.AXIS_VIEW_TOP]=[t.KEY_NUM_5],s[this.AXIS_VIEW_BOTTOM]=[t.KEY_NUM_6];}this._keyMap=s;}else {const t=e;this._keyMap=t;}}get keyMap(){return this._keyMap}_isKeyDownForAction(e,t){const s=this._keyMap[e];if(!s)return !1;t||(t=this.scene.input.keyDown);for(let e=0,i=s.length;e<i;e++){if(t[s[e]])return !0}return !1}set pivotElement(e){this._controllers.pivotController.setPivotElement(e);}set active(e){this._configs.active=!1!==e;}get active(){return this._configs.active}set navMode(e){"firstPerson"!==(e=e||"orbit")&&"orbit"!==e&&"planView"!==e&&(this.error("Unsupported value for navMode: "+e+" - supported values are 'orbit', 'firstPerson' and 'planView' - defaulting to 'orbit'"),e="orbit"),this._configs.firstPerson="firstPerson"===e,this._configs.planView="planView"===e,(this._configs.firstPerson||this._configs.planView)&&(this._controllers.pivotController.hidePivot(),this._controllers.pivotController.endPivot()),this._configs.navMode=e;}get navMode(){return this._configs.navMode}set pointerEnabled(e){this._reset(),this._configs.pointerEnabled=!!e;}_reset(){for(let e=0,t=this._handlers.length;e<t;e++){const t=this._handlers[e];t.reset&&t.reset();}this._updates.panDeltaX=0,this._updates.panDeltaY=0,this._updates.rotateDeltaX=0,this._updates.rotateDeltaY=0,this._updates.dolyDelta=0;}get pointerEnabled(){return this._configs.pointerEnabled}set followPointer(e){this._configs.followPointer=!1!==e;}get followPointer(){return this._configs.followPointer}set pivotPos(e){this._controllers.pivotController.setPivotPos(e);}get pivotPos(){return this._controllers.pivotController.getPivotPos()}set dollyToPointer(e){this.warn("dollyToPointer property is deprecated - replaced with followPointer"),this.followPointer=e;}get dollyToPointer(){return this.warn("dollyToPointer property is deprecated - replaced with followPointer"),this.followPointer}set panToPointer(e){this.warn("panToPointer property is deprecated - replaced with followPointer");}get panToPointer(){return this.warn("panToPointer property is deprecated - replaced with followPointer"),!1}set planView(e){this._configs.planView=!!e,this._configs.firstPerson=!1,this._configs.planView&&(this._controllers.pivotController.hidePivot(),this._controllers.pivotController.endPivot()),this.warn("planView property is deprecated - replaced with navMode");}get planView(){return this.warn("planView property is deprecated - replaced with navMode"),this._configs.planView}set firstPerson(e){this.warn("firstPerson property is deprecated - replaced with navMode"),this._configs.firstPerson=!!e,this._configs.planView=!1,this._configs.firstPerson&&(this._controllers.pivotController.hidePivot(),this._controllers.pivotController.endPivot());}get firstPerson(){return this.warn("firstPerson property is deprecated - replaced with navMode"),this._configs.firstPerson}set constrainVertical(e){this._configs.constrainVertical=!!e;}get constrainVertical(){return this._configs.constrainVertical}set doublePickFlyTo(e){this._configs.doublePickFlyTo=!1!==e;}get doublePickFlyTo(){return this._configs.doublePickFlyTo}set panRightClick(e){this._configs.panRightClick=!1!==e;}get panRightClick(){return this._configs.panRightClick}set rotationInertia(e){this._configs.rotationInertia=null!=e?e:0;}get rotationInertia(){return this._configs.rotationInertia}set keyboardPanRate(e){this._configs.keyboardPanRate=null!=e?e:5;}set touchPanRate(e){this._configs.touchPanRate=null!=e?e:1;}get touchPanRate(){return this._configs.touchPanRate}get keyboardPanRate(){return this._configs.keyboardPanRate}set keyboardRotationRate(e){this._configs.keyboardRotationRate=null!=e?e:90;}get keyboardRotationRate(){return this._configs.keyboardRotationRate}set dragRotationRate(e){this._configs.dragRotationRate=null!=e?e:360;}get dragRotationRate(){return this._configs.dragRotationRate}set keyboardDollyRate(e){this._configs.keyboardDollyRate=null!=e?e:15;}get keyboardDollyRate(){return this._configs.keyboardDollyRate}set touchDollyRate(e){this._configs.touchDollyRate=null!=e?e:.2;}get touchDollyRate(){return this._configs.touchDollyRate}set mouseWheelDollyRate(e){this._configs.mouseWheelDollyRate=null!=e?e:100;}get mouseWheelDollyRate(){return this._configs.mouseWheelDollyRate}set dollyInertia(e){this._configs.dollyInertia=null!=e?e:0;}get dollyInertia(){return this._configs.dollyInertia}set dollyProximityThreshold(e){this._configs.dollyProximityThreshold=null!=e?e:35;}get dollyProximityThreshold(){return this._configs.dollyProximityThreshold}set dollyMinSpeed(e){this._configs.dollyMinSpeed=null!=e?e:.04;}get dollyMinSpeed(){return this._configs.dollyMinSpeed}set panInertia(e){this._configs.panInertia=null!=e?e:.5;}get panInertia(){return this._configs.panInertia}set keyboardLayout(e){"qwerty"!==(e=e||"qwerty")&&"azerty"!==e&&(this.error("Unsupported value for keyboardLayout - defaulting to 'qwerty'"),e="qwerty"),this._configs.keyboardLayout=e,this.keyMap=this._configs.keyboardLayout;}get keyboardLayout(){return this._configs.keyboardLayout}set smartPivot(e){this._configs.smartPivot=!1!==e;}get smartPivot(){return this._configs.smartPivot}set doubleClickTimeFrame(e){this._configs.doubleClickTimeFrame=null!=e?e:250;}get doubleClickTimeFrame(){return this._configs.doubleClickTimeFrame}destroy(){this._destroyHandlers(),this._destroyControllers(),this._cameraUpdater.destroy(),super.destroy();}_destroyHandlers(){for(let e=0,t=this._handlers.length;e<t;e++){const t=this._handlers[e];t.destroy&&t.destroy();}}_destroyControllers(){for(let e=0,t=this._controllers.length;e<t;e++){const t=this._controllers[e];t.destroy&&t.destroy();}}}class hR{constructor(e,t,s,i,r,o,n,a,h,l){this.id=t,this.projectId=s,this.revisionId=i,this.author=r,this.createdAt=o,this.creatingApplication=n,this.schema=a,this.metaScene=e,this.propertySets=h,this.rootMetaObject=l;}getJSON(){const e=[];!function t(s){const i={id:s.id,extId:s.extId,type:s.type,name:s.name};s.parent&&(i.parent=s.parent.id),e.push(i);const r=s.children;if(r)for(let e=0,s=r.length;e<s;e++)t(r[e]);}(this.rootMetaObject);return {id:this.id,projectId:this.projectId,revisionId:this.revisionId,metaObjects:e}}}class lR{constructor(e,t,s,i,r,o,n,a,h){this.metaModel=e,this.id=t,this.originalSystemId=s,this.name=i,this.type=r,this.propertySets=o,null!=n&&(this.parent=n),null!=a&&(this.children=a),null!=h&&(this.external=h);}getObjectIDsInSubtree(){const e=[];return function t(s){if(!s)return;e.push(s.id);const i=s.children;if(i)for(var r=0,o=i.length;r<o;r++)t(i[r]);}(this),e}withMetaObjectsInSubtree(e){!function t(s){if(!s)return;e(s);const i=s.children;if(i)for(var r=0,o=i.length;r<o;r++)t(i[r]);}(this);}getObjectIDsInSubtreeByType(e){const t={};for(var s=0,i=e.length;s<i;s++)t[e[s]]=e[s];const r=[];return function e(s){if(!s)return;t[s.type]&&r.push(s.id);const i=s.children;if(i)for(var o=0,n=i.length;o<n;o++)e(i[o]);}(this),r}getJSON(){var e={id:this.id,type:this.type,name:this.name};return this.parent&&(e.parent=this.parent.id),e}}class uR{constructor(e,t,s,i,r){this.name=e,this.type=s,this.value=t,this.valueType=i,this.description=r;}}class cR{constructor(e,t,s,i,r){if(this.id=e,this.originalSystemId=t,this.name=s,this.type=i,this.properties=[],r)for(let e=0,t=r.length;e<t;e++){const t=r[e];this.properties.push(new uR(t.name,t.value,t.type,t.valueType,t.description));}}}class pR{constructor(e,t){this.viewer=e,this.scene=t,this.metaModels={},this.propertySets={},this.metaObjects={},this.metaObjectsByType={},this._typeCounts={},this._eventSubs={};}on(e,t){let s=this._eventSubs[e];s||(s=[],this._eventSubs[e]=s),s.push(t);}fire(e,t){const s=this._eventSubs[e];if(s)for(let e=0,i=s.length;e<i;e++)s[e](t);}off(e){}createMetaModel(e,t,s={}){const i=t.projectId||"none",r=t.revisionId||"none",o=t.propertySets||[],n=t.metaObjects||[],a=t.author,h=t.createdAt,l=t.creatingApplication,u=t.schema,c=new hR(this,e,i,r,a,h,l,u,[],null);this.metaModels[e]=c;for(let e=0,t=o.length;e<t;e++){const t=o[e],s=t.id,i=new cR(s,t.originalSystemId,t.name,t.type,t.properties);c.propertySets[s]=i,this.propertySets[s]=i;}const p=[];for(let e=0,t=n.length;e<t;e++){const t=n[e];void 0!==t.parent&&null!==t.parent||p.push(t);}if(0===p.length){this.scene.error("Cyclic containment hierarchy found in metamodel - will flatten the hierarchy and insert fake 'Model' root");const t={id:e+".fakeRoot",name:e,type:"Model",parent:null};for(let e=0,s=n.length;e<s;e++)n[e].parent=t.id;n.push(t);}if(p.length>1){this.scene.error("Multiple containment hierarchy root found in metamodel - will insert fake 'Model' root");const t={id:e+".fakeRoot",name:e,type:"Model",parent:null};n.push(t);for(let e=0,s=p.length;e<s;e++)p[e].parent=t.id;}for(let t=0,i=n.length;t<i;t++){const i=n[t],r=i.type,o=s.globalizeObjectIds?f.globalizeObjectId(e,i.id):i.id,a=i.id,h=i.name,l=[];if(i.propertySetIds&&i.propertySetIds.length>0)for(let e=0,t=i.propertySetIds.length;e<t;e++){const t=i.propertySetIds[e],s=c.propertySets[t];s&&l.push(s);}const u=null,p=null,d=i.external,m=new lR(c,o,a,h,r,l,u,p,d);this.metaObjects[o]=m,(this.metaObjectsByType[r]||(this.metaObjectsByType[r]={}))[o]=m,void 0===this._typeCounts[r]?this._typeCounts[r]=1:this._typeCounts[r]++;}for(let t=0,i=n.length;t<i;t++){const i=n[t],r=s.globalizeObjectIds?f.globalizeObjectId(e,i.id):i.id,o=this.metaObjects[r];if(o)if(void 0===i.parent||null===i.parent)c.rootMetaObject=o;else if(i.parent){const t=s.globalizeObjectIds?f.globalizeObjectId(e,i.parent):i.parent;let r=this.metaObjects[t];r&&(o.parent=r,r.children=r.children||[],r.children.push(o));}}return this.fire("metaModelCreated",e),c}destroyMetaModel(e){const t=this.metaModels[e];t&&(this._removeMetaModel(t),this.fire("metaModelDestroyed",e));}_removeMetaModel(e){const t=this.metaObjects,s=this.metaObjectsByType;let i=e=>{delete t[e.id];const r=s[e.type];r&&r[e.id]&&(delete r[e.id],0==--this._typeCounts[e.type]&&(delete this._typeCounts[e.type],delete s[e.type]));const o=e.children;if(o)for(let e=0,t=o.length;e<t;e++){const t=o[e];i(t);}};i(e.rootMetaObject);for(let t in e.propertySets)e.propertySets.hasOwnProperty(t)&&delete this.propertySets[t];delete this.metaModels[e.id];}getObjectIDsByType(e){const t=this.metaObjectsByType[e];return t?Object.keys(t):[]}getObjectIDsInSubtree(e,t,s){const i=[],r=this.metaObjects[e],o=t&&t.length>0?dR(t):null,n=s&&s.length>0?dR(s):null;return function e(t){if(!t)return;var s=!0;(n&&n[t.type]||o&&!o[t.type])&&(s=!1),s&&i.push(t.id);const r=t.children;if(r)for(var a=0,h=r.length;a<h;a++)e(r[a]);}(r),i}withMetaObjectsInSubtree(e,t){const s=this.metaObjects[e];s&&s.withMetaObjectsInSubtree(t);}}function dR(e){const t={};for(var s=0,i=e.length;s<i;s++)t[e[s]]=!0;return t}class fR{constructor(e){this.language="en",this.localeService=e.localeService||new jE,this.scene=new Ut(this,{canvasId:e.canvasId,canvasElement:e.canvasElement,keyboardEventsElement:e.keyboardEventsElement,contextAttr:{preserveDrawingBuffer:!1!==e.preserveDrawingBuffer,premultipliedAlpha:!!e.premultipliedAlpha,antialias:!1!==e.antialias},spinnerElementId:e.spinnerElementId,transparent:!1!==e.transparent,gammaInput:!0,gammaOutput:!1,backgroundColor:e.backgroundColor,backgroundColorFromAmbientLight:e.backgroundColorFromAmbientLight,ticksPerRender:1,ticksPerOcclusionTest:20,units:e.units,scale:e.scale,origin:e.origin,saoEnabled:e.saoEnabled,alphaDepthMask:!1!==e.alphaDepthMask,entityOffsetsEnabled:!!e.entityOffsetsEnabled,pickSurfacePrecisionEnabled:!!e.pickSurfacePrecisionEnabled,logarithmicDepthBufferEnabled:!!e.logarithmicDepthBufferEnabled,pbrEnabled:!!e.pbrEnabled,colorTextureEnabled:!1!==e.colorTextureEnabled}),this.metaScene=new pR(this,this.scene),this.id=e.id||this.scene.id,this.camera=this.scene.camera,this.cameraFlight=new QE(this.scene,{duration:.5}),this.cameraControl=new aR(this.scene,{doublePickFlyTo:!0}),this._plugins=[],this._eventSubs={};}get capabilities(){return this.scene.capabilities}on(e,t){let s=this._eventSubs[e];s||(s=[],this._eventSubs[e]=s),s.push(t);}fire(e,t){const s=this._eventSubs[e];if(s)for(let e=0,i=s.length;e<i;e++)s[e](t);}off(e){}log(e){console.log(`[xeokit viewer ${this.id}]: ${e}`);}error(e){console.error(`[xeokit viewer ${this.id}]: ${e}`);}addPlugin(e){this._plugins.push(e);}removePlugin(e){for(let t=0,s=this._plugins.length;t<s;t++){const s=this._plugins[t];if(s===e)return s.clear&&s.clear(),void this._plugins.splice(t,1)}}sendToPlugins(e,t){for(let s=0,i=this._plugins.length;s<i;s++){const i=this._plugins[s];i.send&&i.send(e,t);}}clear(){throw 'Viewer#clear() no longer implemented - use \'#sendToPlugins("clear") instead'}resetView(){throw "Viewer#resetView() no longer implemented - use CameraMemento & ObjectsMemento classes instead"}beginSnapshot(){this._snapshotBegun||(this.scene._renderer.beginSnapshot(),this._snapshotBegun=!0);}getSnapshot(e={}){const t=!this._snapshotBegun;this._snapshotBegun||this.beginSnapshot(),e.includeGizmos||this.sendToPlugins("snapshotStarting");const s=void 0!==e.width&&void 0!==e.height,i=this.scene.canvas.canvas,r=i.clientWidth,o=i.clientHeight,n=i.style.width,a=i.style.height,h=e.width?Math.floor(e.width):i.width,l=e.height?Math.floor(e.height):i.height;s&&(i.style.width=h+"px",i.style.height=l+"px"),this.scene._renderer.renderSnapshot();const u=this.scene._renderer.readSnapshot(e);return s&&(i.style.width=n,i.style.height=a,i.width=r,i.height=o,this.scene.glRedraw()),e.includeGizmos||this.sendToPlugins("snapshotFinished"),t&&this.endSnapshot(),u}endSnapshot(){this._snapshotBegun&&(this.scene._renderer.endSnapshot(),this.scene._renderer.render({force:!0}),this._snapshotBegun=!1);}destroy(){const e=this._plugins.slice();for(let t=0,s=e.length;t<s;t++){e[t].destroy();}this.scene.destroy();}}const YR=f.vec2(),KR=f.vec3(),JR=f.vec3(),ZR=f.vec3();

/**
 * Default server client which loads content for a {@link BIMViewer} via HTTP from the file system.
 *
 * A BIMViewer is instantiated with an instance of this class.
 *
 * To load content from an alternative source, instantiate BIMViewer with your own custom implementation of this class.
 */
class Server {

    /**
     * Constructs a Server.
     *
     * @param {*} [cfg] Server configuration.
     * @param {String} [cfg.dataDir] Base directory for content.
     * @param {String} [cfg.organization] FM organization.
     * @param {String} [cfg.building] FM building.
     */
    constructor(cfg) {
        this._organization = cfg.organization;
        this._building = cfg.building;
        this._prefix = `${this._organization}.${this._building}`;
        this._dataDir = cfg.dataDir;
    }

    /**
     * Gets information on all available projects.
     *
     * @param {Function} done Callback through which the JSON result is returned.
     * @param {Function} error Callback through which an error message is returned on error.
     */
    getProjects(done, error) {
        const url = this._dataDir + "/projects/index.json";
        b.loadJSON(url, done, error);
    }

    /**
     * Gets information for a project.
     *
     * @param {String} projectId ID of the project.
     * @param {Function} done Callback through which the JSON result is returned.
     * @param {Function} error Callback through which an error message is returned on error.
     */
    getProject(projectId, done, error) {
        const url = this._dataDir + "/projects/" + projectId + "/index.json";
        b.loadJSON(url, done, error);
    }

    /**
     * Gets metadata for a model within a project.
     *
     * @param {String} projectId ID of the project.
     * @param {String} modelId ID of the model.
     * @param {Function} done Callback through which the JSON result is returned.
     * @param {Function} error Callback through which an error message is returned on error.
     */
    getMetadata(projectId, modelId, done, error) {
        const url = this._dataDir + "/projects/" + projectId + "/models/" + modelId + "/metadata.json";
        b.loadJSON(url, done, error);
    }

    /**
     * Gets geometry for a model within a project.
     *
     * @param {String} projectId ID of the project.
     * @param {String} modelId ID of the model.
     * @param {Function} done Callback through which the JSON result is returned.
     * @param {Function} error Callback through which an error message is returned on error.
     */
    getGeometry(projectId, modelId, done, error) {
        const url = this._dataDir + "/projects/" + projectId + "/models/" + modelId + "/geometry.xkt";
        b.loadArraybuffer(url, done, error);
    }

    /**
     * Gets metadata for an object within a model within a project.
     *
     * @param {String} projectId ID of the project.
     * @param {String} modelId ID of the model.
     * @param {String} objectId ID of the object.
     * @param {Function} done Callback through which the JSON result is returned.
     * @param {Function} error Callback through which an error message is returned on error.
     */
    getObjectInfo(projectId, modelId, objectId, done, error) {
        const url = this._dataDir + "/projects/" + projectId + "/models/" + modelId + "/props/" + objectId + ".json";
        b.loadJSON(url, done, error);
    }

    /**
     * Gets existing issues for a model within a project.
     *
     * @param {String} projectId ID of the project.
     * @param {String} modelId ID of the model.
     * @param {Function} done Callback through which the JSON result is returned.
     * @param {Function} error Callback through which an error message is returned on error.
     */
    getIssues(projectId, modelId, done, error) {
        const url = this._dataDir + "/projects/" + projectId + "/models/" + modelId + "/issues.json";
        b.loadJSON(url, done, error);
    }
}

/** @private */
class Map$1 {

    constructor(items, baseId) {
        this.items = items || [];
        this._lastUniqueId = (baseId || 0) + 1;
    }

    /**
     * Usage:
     *
     * id = myMap.addItem("foo") // ID internally generated
     * id = myMap.addItem("foo", "bar") // ID is "foo"
     */
    addItem() {
        let item;
        if (arguments.length === 2) {
            const id = arguments[0];
            item = arguments[1];
            if (this.items[id]) { // Won't happen if given ID is string
                throw "ID clash: '" + id + "'";
            }
            this.items[id] = item;
            return id;

        } else {
            item = arguments[0] || {};
            while (true) {
                const findId = this._lastUniqueId++;
                if (!this.items[findId]) {
                    this.items[findId] = item;
                    return findId;
                }
            }
        }
    }

    removeItem(id) {
        const item = this.items[id];
        delete this.items[id];
        return item;
    }
}

/** @private */
class Controller {

    /**
     * @protected
     */
    constructor(parent, cfg, server, viewer) {

        this.bimViewer = (parent ? (parent.bimViewer || parent) : this);
        this.server = parent ? parent.server : server;
        this.viewer = parent ? parent.viewer : viewer;

        this._children = [];

        if (parent) {
            parent._children.push(this);
        }

        this._subIdMap = null; // Subscription subId pool
        this._subIdEvents = null; // Subscription subIds mapped to event names
        this._eventSubs = null; // Event names mapped to subscribers
        this._events = null; // Maps names to events
        this._eventCallDepth = 0; // Helps us catch stack overflows from recursive events

        this._enabled = null; // Used by #setEnabled() and #getEnabled()
        this._active = null; // Used by #setActive() and #getActive()
    }

    /**
     * Fires an event on this Controller.
     *
     * @protected
     *
     * @param {String} event The event type name
     * @param {Object} value The event parameters
     * @param {Boolean} [forget=false] When true, does not retain for subsequent subscribers
     */
    fire(event, value, forget) {
        if (!this._events) {
            this._events = {};
        }
        if (!this._eventSubs) {
            this._eventSubs = {};
        }
        if (forget !== true) {
            this._events[event] = value || true; // Save notification
        }
        const subs = this._eventSubs[event];
        let sub;
        if (subs) { // Notify subscriptions
            for (const subId in subs) {
                if (subs.hasOwnProperty(subId)) {
                    sub = subs[subId];
                    this._eventCallDepth++;
                    if (this._eventCallDepth < 300) {
                        sub.callback.call(sub.scope, value);
                    } else {
                        this.error("fire: potential stack overflow from recursive event '" + event + "' - dropping this event");
                    }
                    this._eventCallDepth--;
                }
            }
        }
    }

    /**
     * Subscribes to an event on this Controller.
     *
     * The callback is be called with this component as scope.
     *
     * @param {String} event The event
     * @param {Function} callback Called fired on the event
     * @param {Object} [scope=this] Scope for the callback
     * @return {String} Handle to the subscription, which may be used to unsubscribe with {@link #off}.
     */
    on(event, callback, scope) {
        if (!this._events) {
            this._events = {};
        }
        if (!this._subIdMap) {
            this._subIdMap = new Map$1(); // Subscription subId pool
        }
        if (!this._subIdEvents) {
            this._subIdEvents = {};
        }
        if (!this._eventSubs) {
            this._eventSubs = {};
        }
        let subs = this._eventSubs[event];
        if (!subs) {
            subs = {};
            this._eventSubs[event] = subs;
        }
        const subId = this._subIdMap.addItem(); // Create unique subId
        subs[subId] = {
            callback: callback,
            scope: scope || this
        };
        this._subIdEvents[subId] = event;
        const value = this._events[event];
        if (value !== undefined) { // A publication exists, notify callback immediately
            callback.call(scope || this, value);
        }
        return subId;
    }

    /**
     * Cancels an event subscription that was previously made with {@link Controller#on} or {@link Controller#once}.
     *
     * @param {String} subId Subscription ID
     */
    off(subId) {
        if (subId === undefined || subId === null) {
            return;
        }
        if (!this._subIdEvents) {
            return;
        }
        const event = this._subIdEvents[subId];
        if (event) {
            delete this._subIdEvents[subId];
            const subs = this._eventSubs[event];
            if (subs) {
                delete subs[subId];
            }
            this._subIdMap.removeItem(subId); // Release subId
        }
    }

    /**
     * Subscribes to the next occurrence of the given event, then un-subscribes as soon as the event is handled.
     *
     * This is equivalent to calling {@link Controller#on}, and then calling {@link Controller#off} inside the callback function.
     *
     * @param {String} event Data event to listen to
     * @param {Function} callback Called when fresh data is available at the event
     * @param {Object} [scope=this] Scope for the callback
     */
    once(event, callback, scope) {
        const self = this;
        const subId = this.on(event,
            function (value) {
                self.off(subId);
                callback.call(scope || this, value);
            },
            scope);
    }

    /**
     * Logs a console debugging message for this Controller.
     *
     * The console message will have this format: *````[LOG] [<component type> <component id>: <message>````*
     *
     * @protected
     *
     * @param {String} message The message to log
     */
    log(message) {
        message = "[LOG] " + message;
        window.console.log(message);
    }

    /**
     * Logs a warning for this Controller to the JavaScript console.
     *
     * The console message will have this format: *````[WARN] [<component type> =<component id>: <message>````*
     *
     * @protected
     *
     * @param {String} message The message to log
     */
    warn(message) {
        message = "[WARN] " + message;
        window.console.warn(message);
    }

    /**
     * Logs an error for this Controller to the JavaScript console.
     *
     * The console message will have this format: *````[ERROR] [<component type> =<component id>: <message>````*
     *
     * @protected
     *
     * @param {String} message The message to log
     */
    error(message) {
        message = "[ERROR] " + message;
        window.console.error(message);
    }

    _mutexActivation(controllers) {
        const numControllers = controllers.length;
        for (let i = 0; i < numControllers; i++) {
            const controller = controllers[i];
            controller.on("active", (function () {
                const _i = i;
                return function (active) {
                    if (!active) {
                        return;
                    }
                    for (let j = 0; j < numControllers; j++) {
                        if (j === _i) {
                            continue;
                        }
                        controllers[j].setActive(false);
                    }
                };
            })());
        }
    }

    /**
     * Enables or disables this Controller.
     *
     * Fires an "enabled" event on update.
     *
     * @protected
     * @param {boolean} enabled Whether or not to enable.
     */
    setEnabled(enabled) {
        if (this._enabled === enabled) {
            return;
        }
        this._enabled = enabled;
        this.fire("enabled", this._enabled);
    }

    /**
     * Gets whether or not this Controller is enabled.
     *
     * @protected
     *
     * @returns {boolean}
     */
    getEnabled() {
        return this._enabled;
    }

    /**
     * Activates or deactivates this Controller.
     *
     * Fires an "active" event on update.
     *
     * @protected
     *
     * @param {boolean} active Whether or not to activate.
     */
    setActive(active) {
        if (this._active === active) {
            return;
        }
        this._active = active;
        this.fire("active", this._active);
    }

    /**
     * Gets whether or not this Controller is active.
     *
     * @protected
     *
     * @returns {boolean}
     */
    getActive() {
        return this._active;
    }

    /**
     * Destroys this Controller.
     *
     * @protected
     *
     */
    destroy() {
        if (this.destroyed) {
            return;
        }
        /**
         * Fired when this Controller is destroyed.
         * @event destroyed
         */
        this.fire("destroyed", this.destroyed = true);
        this._subIdMap = null;
        this._subIdEvents = null;
        this._eventSubs = null;
        this._events = null;
        this._eventCallDepth = 0;
        for (let i = 0, len = this._children.length; i < len; i++) {
            this._children[i].destroy();
        }
        this._children = [];
    }
}

/** @private */
class BusyModal extends Controller {

    constructor(parent, cfg = {}) {

        super(parent, cfg);

        const busyModalBackdropElement = cfg.busyModalBackdropElement || document.body;

        if (!busyModalBackdropElement) {
            throw "Missing config: busyModalBackdropElement";
        }

        this._modal = document.createElement("div");
        this._modal.classList.add("xeokit-busy-modal");
        this._modal.innerHTML = '<div class="xeokit-busy-modal-content"><div class="xeokit-busy-modal-body"><div class="xeokit-busy-modal-message">Default text</div></div></div>';

        busyModalBackdropElement.appendChild(this._modal);

        this._modalVisible = false;
        this._modal.style.display = 'hidden';
    }

    show(message) {
        this._modalVisible = true;
        this._modal.querySelector('.xeokit-busy-modal-message').innerText = message;
        this._modal.style.display = 'block';
    }

    hide() {
        this._modalVisible = false;
        this._modal.style.display = 'none';
    }

    destroy() {
        super.destroy();
        if (this._modal) {
            this._modal.parentNode.removeChild(this._modal);
            this._modal = null;
        }
    }
}

const tempVec3a = f.vec3();

/** @private */
class ResetAction extends Controller {

    constructor(parent, cfg = {}) {

        super(parent, cfg);

        if (!cfg.buttonElement) {
            throw "Missing config: buttonElement";
        }

        const buttonElement = cfg.buttonElement;
        const camera = this.viewer.camera;

        this._modelMementos = {};

        // Initial camera position - looking down negative diagonal

        camera.eye = [0.577, 0.577, 0.577];
        camera.look = [0,0,0];
        camera.up = [-1, 1, -1];

        this.bimViewer._modelsExplorer.on("modelLoaded", (modelId) => {
            this._saveModelMemento(modelId);
        });

        this.bimViewer._modelsExplorer.on("modelUnloaded", (modelId) => {
            this._destroyModelMemento(modelId);
        });

        this.on("enabled", (enabled) => {
            if (!enabled) {
                buttonElement.classList.add("disabled");
            } else {
                buttonElement.classList.remove("disabled");
            }
        });

        this.on("active", (active) => {
            if (active) {
                buttonElement.classList.add("active");
            } else {
                buttonElement.classList.remove("active");
            }
        });

        buttonElement.addEventListener("click", (event) => {
            if (this.getEnabled()) {
                this.reset();
            }
            event.preventDefault();
        });
    }

    _saveModelMemento(modelId) {
        const metaModel = this.viewer.metaScene.metaModels[modelId];
        if (!metaModel) {
            return;
        }
        const modelMemento = new bS();
        modelMemento.saveObjects(this.viewer.scene, metaModel, {
            visible: true,
            edges: true,
            xrayed: true,
            highlighted: true,
            selected: true,
            clippable: true,
            pickable: true,
            colorize: false, // We don't colorize objects yet - also messes up point clouds
            opacity: false // FIXME: Restoring opacity broken by colorize fix - details at https://github.com/xeokit/xeokit-sdk/issues/239
        });
        this._modelMementos[modelId] = modelMemento;
    }

    _restoreModelMemento(modelId) {
        const metaModel = this.viewer.metaScene.metaModels[modelId];
        if (!metaModel) {
            return;
        }
        const modelMemento = this._modelMementos[modelId];
        modelMemento.restoreObjects(this.viewer.scene, metaModel);
    }

    _destroyModelMemento(modelId) {
        delete this._modelMementos[modelId];
    }

    reset() {
        const scene = this.viewer.scene;
        const modelIds = scene.modelIds;
        for (var i = 0, len = modelIds.length; i < len; i++) {
            const modelId = modelIds[i];
            this._restoreModelMemento(modelId);
        }
        this.bimViewer.unShowObjectInExplorers();
        this.fire("reset", true);
        this._resetCamera();
    }

    _resetCamera() {
        const viewer = this.viewer;
        const scene = viewer.scene;
        const aabb = scene.getAABB(scene.visibleObjectIds);
        const diag = f.getAABB3Diag(aabb);
        const center = f.getAABB3Center(aabb, tempVec3a);
        const camera = scene.camera;
        const fitFOV = camera.perspective.fov;
        const dist = Math.abs(diag / Math.tan(45 * f.DEGTORAD));
        const dir = f.normalizeVec3((camera.yUp) ? [-0.5, -0.7071, -0.5] : [-1, 1, -1]);
        const up = f.normalizeVec3((camera.yUp) ? [-0.5, 0.7071, -0.5] : [-1, 1, 1]);
        viewer.cameraControl.pivotPos = center;
        viewer.cameraControl.planView = false;
        viewer.cameraFlight.flyTo({
            look: center,
            eye: [center[0] - (dist * dir[0]), center[1] - (dist * dir[1]), center[2] - (dist * dir[2])],
            up: up,
            orthoScale: diag * 1.3,
            projection: "perspective",
            duration: 1
        });
    }
}

const tempVec3 = f.vec3();

/** @private */
class FitAction extends Controller {

    constructor(parent, cfg={}) {

        super(parent, cfg);

        if (!cfg.buttonElement) {
            throw "Missing config: buttonElement";
        }

        const buttonElement = cfg.buttonElement;

        this.on("enabled", (enabled) => {
            if (!enabled) {
                buttonElement.classList.add("disabled");
            } else {
                buttonElement.classList.remove("disabled");
            }
        });

        this.on("active", (active) => {
            if (active) {
                buttonElement.classList.add("active");
            } else {
                buttonElement.classList.remove("active");
            }
        });

        buttonElement.addEventListener("click", (event) => {
            if (this.getEnabled()) {
                this.fit();
            }
            event.preventDefault();
        });
    }

    fit() {
        const scene = this.viewer.scene;
        const aabb = scene.getAABB(scene.visibleObjectIds);
        this.viewer.cameraFlight.flyTo({
            aabb: aabb
        });
        this.viewer.cameraControl.pivotPos = f.getAABB3Center(aabb, tempVec3);
    }

    set fov(fov) {
        this.viewer.scene.cameraFlight.fitFOV = fov;
    }

    get fov() {
        return this.viewer.scene.cameraFlight.fitFOV;
    }

    set duration(duration) {
        this.viewer.scene.cameraFlight.duration = duration;
    }

    get duration() {
        return this.viewer.scene.cameraFlight.duration;
    }
}

/** @private */
class FirstPersonMode extends Controller {

    constructor(parent, cfg) {

        super(parent, cfg);

        if (!cfg.buttonElement) {
            throw "Missing config: buttonElement";
        }

        const buttonElement = cfg.buttonElement;
        const cameraControl = this.viewer.cameraControl;
        const cameraControlNavModeMediator = cfg.cameraControlNavModeMediator;

        cameraControl.navMode = "orbit";
        cameraControl.followPointer = true;

        this.on("enabled", (enabled) => {
            if (!enabled) {
                buttonElement.classList.add("disabled");
            } else {
                buttonElement.classList.remove("disabled");
            }
        });

        this.on("active", (active) => {
            if (active) {
                buttonElement.classList.add("active");
            } else {
                buttonElement.classList.remove("active");
            }
        });

        this.on("active", (active) => {
            cameraControlNavModeMediator.setFirstPersonModeActive(active);
            if (active) {
                cameraControl.followPointer = true;
                cameraControl.pivoting = false;
            } else {
                cameraControl.pivoting = true;
            }
        });

        buttonElement.addEventListener("click", (event) => {
            if (this.getEnabled()) {
                const active = this.getActive();
                this.setActive(!active);
            }
            event.preventDefault();
        });

        this.bimViewer.on("reset", ()=>{
            this.setActive(false);
        });
    }
}

/** @private */
class HideTool extends Controller {

    constructor(parent, cfg) {

        super(parent, cfg);

        if (!cfg.buttonElement) {
            throw "Missing config: buttonElement";
        }

        const buttonElement = cfg.buttonElement;

        this.on("enabled", (enabled) => {
            if (!enabled) {
                buttonElement.classList.add("disabled");
            } else {
                buttonElement.classList.remove("disabled");
            }
        });

        this.on("active", (active) => {
            if (active) {
                buttonElement.classList.add("active");
                this.viewer.cameraControl.doublePickFlyTo = false;
                this._onPick = this.viewer.cameraControl.on("picked", (pickResult) => {
                    if (!pickResult.entity) {
                        return;
                    }
                    pickResult.entity.visible = false;
                });
            } else {
                buttonElement.classList.remove("active");
                this.viewer.cameraControl.doublePickFlyTo = false;
                if (this._onPick !== undefined) {
                    this.viewer.cameraControl.off(this._onPick);
                    this._onPick = undefined;
                }
            }
        });

        buttonElement.addEventListener("click", (event) => {
            if (this.getEnabled()) {
                this.bimViewer._sectionTool.hideControl();
                const active = this.getActive();
                this.setActive(!active);
            }
            event.preventDefault();
        });

        this.bimViewer.on("reset", () => {
            this.setActive(false);
        });
    }
}

/** @private */
class SelectionTool extends Controller {

    constructor(parent, cfg) {

        super(parent);

        if (!cfg.buttonElement) {
            throw "Missing config: buttonElement";
        }

        const buttonElement = cfg.buttonElement;

        this.on("enabled", (enabled) => {
            if (!enabled) {
                buttonElement.classList.add("disabled");
            } else {
                buttonElement.classList.remove("disabled");
            }
        });

        this.on("active", (active) => {
            if (active) {
                buttonElement.classList.add("active");
                this._onPick = this.viewer.cameraControl.on("picked", (pickResult) => {
                    if (!pickResult.entity) {
                        return;
                    }
                  pickResult.entity.selected = !pickResult.entity.selected;
                });
            } else {
                buttonElement.classList.remove("active");
                if (this._onPick !== undefined) {
                    this.viewer.cameraControl.off(this._onPick);
                    this._onPick = undefined;
                }
            }
        });

        buttonElement.addEventListener("click", (event) => {
            if (this.getEnabled()) {
                this.bimViewer._sectionTool.hideControl();
                const active = this.getActive();
                this.setActive(!active);
            }
            event.preventDefault();
        });

        this.bimViewer.on("reset", () => {
            this.setActive(false);
        });
    }
}

/** @private */
class ShowSpacesMode extends Controller {

    constructor(parent, cfg) {

        super(parent, cfg);

        if (!cfg.buttonElement) {
            throw "Missing config: buttonElement";
        }

        this._buttonElement = cfg.buttonElement;

        this.on("enabled", (enabled) => {
            if (!enabled) {
                this._buttonElement.classList.add("disabled");
            } else {
                this._buttonElement.classList.remove("disabled");
            }
        });

        this._buttonElement.addEventListener("click", (event) => {
            if (this.getEnabled()) {
                this.setActive(!this.getActive(), () => {
                });
            }
            event.preventDefault();
        });

        this.bimViewer.on("reset", () => {
            this.setActive(false); // IfcSpaces hidden by default
        });

        this.viewer.scene.on("modelLoaded", (modelId) => {
            if (!this._active) {
                const objectIds = this.viewer.metaScene.getObjectIDsByType("IfcSpace");
                this.viewer.scene.setObjectsCulled(objectIds, true);
            }
        });
        
        this._active = false;
        this._buttonElement.classList.remove("active");
    }

    setActive(active) {
        if (this._active === active) {
            return;
        }
        this._active = active;
        if (active) {
            this._buttonElement.classList.add("active");
            this._enterShowSpacesMode();
            this.fire("active", this._active);
        } else {
            this._buttonElement.classList.remove("active");
            this._exitShowSpacesMode();
            this.fire("active", this._active);
        }
    }

    _enterShowSpacesMode() {
        const viewer = this.viewer;
        const scene = viewer.scene;
        const metaScene = viewer.metaScene;
        const objectIds = metaScene.getObjectIDsByType("IfcSpace");
        scene.setObjectsCulled(objectIds, false);
    }

    _exitShowSpacesMode() {
        const viewer = this.viewer;
        const scene = viewer.scene;
        const metaScene = viewer.metaScene;
        const objectIds = metaScene.getObjectIDsByType("IfcSpace");
        scene.setObjectsCulled(objectIds, true);
    }
}

/** @private */
class QueryTool extends Controller {

    constructor(parent, cfg) {

        super(parent);

       //  this.on("active", (active) => {
       //      if (active) {
       //          this._onPick = this.viewer.cameraControl.on("picked", (pickResult) => {
       //              if (!pickResult.entity) {
       //                  return;
       //              }
       // //             this.queryEntity(pickResult.entity);
       //          });
       //          this._onPickedNothing = this.viewer.cameraControl.on("pickedNothing", () => {
       //              this.fire("queryNotPicked", false);
       //          });
       //      } else {
       //
       //          if (this._onPick !== undefined) {
       //              this.viewer.cameraControl.off(this._onPick);
       //              this.viewer.cameraControl.off(this._onPickedNothing);
       //              this._onPick = undefined;
       //              this._onPickedNothing = undefined;
       //          }
       //      }
       //  });
       //
       //  this.bimViewer.on("reset", () => {
       //      this.setActive(false);
       //  });
    }
}

const tempAABB = f.AABB3();
const tempVec3$1 = f.vec3();

/**
 * @private
 */
class SectionToolContextMenu extends a {

    constructor(cfg = {}) {

        if (!cfg.sectionPlanesPlugin) {
            throw "Missing config: sectionPlanesPlugin";
        }

        super(b.apply({}, cfg));

        this._sectionPlanesPlugin = cfg.sectionPlanesPlugin;
        this._viewer = this._sectionPlanesPlugin.viewer;

        this._onSceneSectionPlaneCreated = this._viewer.scene.on("sectionPlaneCreated", () => {
            this._buildMenu();
        });

        this._onSceneSectionPlaneDestroyed = this._viewer.scene.on("sectionPlaneDestroyed", () => {
            this._buildMenu();
        });

        this._buildMenu();
    }

    _buildMenu() {

        const sectionPlanesPlugin = this._sectionPlanesPlugin;
        const sectionPlanes = Object.values(sectionPlanesPlugin.sectionPlanes);

        const sectionPlanesMenuItems = [];

        for (let i = 0, len = sectionPlanes.length; i < len; i++) {

            const sectionPlane = sectionPlanes[i];

            sectionPlanesMenuItems.push({

                getTitle: (context) => {
                    return `${context.viewer.localeService.translate("sectionToolContextMenu.slice") || "Slice"} #` + (i + 1);
                },

                doHoverEnter(context) {
                    sectionPlanesPlugin.hideControl();
                    sectionPlanesPlugin.showControl(sectionPlane.id);
                },

                doHoverLeave(context) {
                    sectionPlanesPlugin.hideControl();
                },

                items: [ // Submenu
                    [ // Group
                        {
                            getTitle: (context) => {
                                return context.viewer.localeService.translate("sectionToolContextMenu.edit") || "Edit";
                            },
                            doAction: (context) => {

                                sectionPlanesPlugin.hideControl();
                                sectionPlanesPlugin.showControl(sectionPlane.id);

                                const sectionPlanePos = sectionPlane.pos;
                                tempAABB.set(this._viewer.scene.aabb);
                                f.getAABB3Center(tempAABB, tempVec3$1);
                                tempAABB[0] += sectionPlanePos[0] - tempVec3$1[0];
                                tempAABB[1] += sectionPlanePos[1] - tempVec3$1[1];
                                tempAABB[2] += sectionPlanePos[2] - tempVec3$1[2];
                                tempAABB[3] += sectionPlanePos[0] - tempVec3$1[0];
                                tempAABB[4] += sectionPlanePos[1] - tempVec3$1[1];
                                tempAABB[5] += sectionPlanePos[2] - tempVec3$1[2];

                                this._viewer.cameraFlight.flyTo({
                                    aabb: tempAABB,
                                    fitFOV: 65
                                });
                            }
                        },
                        {
                            getTitle: (context) => {
                                return context.viewer.localeService.translate("sectionToolContextMenu.flip") || "Flip";
                            },
                            doAction: (context) => {
                                sectionPlane.flipDir();
                            }
                        },
                        {
                            getTitle: (context) => {
                                return context.viewer.localeService.translate("sectionToolContextMenu.delete") || "Delete";
                            },
                            doAction: (context) => {
                                sectionPlane.destroy();
                            }
                        }
                    ]
                ]
            });
        }

        this.items = [
            [
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("sectionToolContextMenu.clearSlices") || "Clear Slices";
                    },
                    getEnabled: (context) => {
                        return (context.bimViewer.getNumSections() > 0);
                    },
                    doAction: (context) => {
                        context.bimViewer.clearSections();
                    }
                },
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("sectionToolContextMenu.flipSlices") || "Flip Slices";
                    },
                    getEnabled: (context) => {
                        return (context.bimViewer.getNumSections() > 0);
                    },
                    doAction: (context) => {
                        context.bimViewer.flipSections();
                    }
                }
            ],

            sectionPlanesMenuItems
        ];
    }

    destroy() {
        super.destroy();
        const scene = this._viewer.scene;
        scene.off(this._onSceneSectionPlaneCreated);
        scene.off(this._onSceneSectionPlaneDestroyed);
    }
}

/** @private */
class SectionTool extends Controller { // XX

    constructor(parent, cfg) {

        super(parent, cfg);

        if (!cfg.buttonElement) {
            throw "Missing config: buttonElement";
        }

        if (!cfg.menuButtonElement) {
            throw "Missing config: menuButtonElement";
        }

        this._buttonElement = cfg.buttonElement;
        this._counterElement = cfg.counterElement;
        this._menuButtonElement = cfg.menuButtonElement;
        this._menuButtonArrowElement = cfg.menuButtonArrowElement;

        this._sectionPlanesPlugin = new wf(this.viewer, {});

        this._sectionToolContextMenu = new SectionToolContextMenu({
            sectionPlanesPlugin: this._sectionPlanesPlugin,
            hideOnMouseDown: false
        });

        this._sectionPlanesPlugin.setOverviewVisible(false);

        this.on("enabled", (enabled) => {
            if (!enabled) {
                this._buttonElement.classList.add("disabled");
                if (this._counterElement) {
                    this._counterElement.classList.add("disabled");
                }
                this._menuButtonElement.classList.add("disabled");
                this._menuButtonArrowElement.classList.add("disabled");
            } else {
                this._buttonElement.classList.remove("disabled");
                if (this._counterElement) {
                    this._counterElement.classList.remove("disabled");
                }
                this._menuButtonElement.classList.remove("disabled");
                this._menuButtonArrowElement.classList.remove("disabled");
            }
        });

        this.on("active", (active) => {
            if (active) {
                this._buttonElement.classList.add("active");
                if (this._counterElement) {
                    this._counterElement.classList.add("active");
                }
                this._menuButtonElement.classList.add("active");
                this._menuButtonArrowElement.classList.add("active");
            } else {
                this._buttonElement.classList.remove("active");
                if (this._counterElement) {
                    this._counterElement.classList.remove("active");
                }
                this._menuButtonElement.classList.remove("active");
                this._menuButtonArrowElement.classList.remove("active");
            }
        });

        this.on("active", (active) => {
            if (!active) {
                this._sectionPlanesPlugin.hideControl();
            }
        });

        this._buttonElement.addEventListener("click", (e) => {
            if (!this.getEnabled()) {
                return;
            }
            if (e.target === this._menuButtonElement || e.target.parentNode === this._menuButtonElement) {
                return;
            }
            const active = this.getActive();
            this.setActive(!active);
            e.preventDefault();
        });

        document.addEventListener("mousedown", (e) => {

            if (e.target.classList.contains("xeokit-context-menu-item")) {
                // Allow click on menu item
                return;
            }

            if (e.target === this._menuButtonElement || e.target.parentNode === this._menuButtonElement) {
                e.preventDefault();
                if (this._sectionToolContextMenu.shown) {
                    this._sectionToolContextMenu.hide();
                } else {
                    this._sectionToolContextMenu.context = {
                        bimViewer: this.bimViewer,
                        viewer: this.viewer,
                        sectionTool: this
                    };

                    const rect = this._menuButtonElement.getBoundingClientRect();

                    this._sectionToolContextMenu.show(rect.left, rect.bottom + 5);
                }
            } else {
                this._sectionToolContextMenu.hide();
            }
        });

        this._sectionToolContextMenu.on("shown", () => {
            this._menuButtonArrowElement.classList.remove("xeokit-arrow-down");
            this._menuButtonArrowElement.classList.add("xeokit-arrow-up");
        });

        this._sectionToolContextMenu.on("hidden", () => {
            this._menuButtonArrowElement.classList.remove("xeokit-arrow-up");
            this._menuButtonArrowElement.classList.add("xeokit-arrow-down");
        });

        this.bimViewer.on("reset", () => {
            this.clear();
            this.setActive(false);
        });

        this.viewer.scene.on("sectionPlaneCreated", ()=> {
            this._updateSectionPlanesCount();
        });

        this.viewer.scene.on("sectionPlaneDestroyed", ()=> {
            this._updateSectionPlanesCount();
        });

        this._initSectionMode();
    }

    _initSectionMode() {

        this.viewer.scene.input.on("mouseclicked", (coords) => {

            if (!this.getActive() || !this.getEnabled()) {
                return;
            }

            const pickResult = this.viewer.scene.pick({
                canvasPos: coords,
                pickSurface: true  // <<------ This causes picking to find the intersection point on the entity
            });

            if (pickResult) {

                const sectionPlane = this._sectionPlanesPlugin.createSectionPlane({
                    pos: pickResult.worldPos,
                    dir: f.mulVec3Scalar(pickResult.worldNormal, -1)
                });

                this._sectionPlanesPlugin.showControl(sectionPlane.id);
            }
        });

        this._updateSectionPlanesCount();
    }

    _updateSectionPlanesCount() {
        if (this._counterElement) {
            this._counterElement.innerText = ("" + this.getNumSections());
        }
    }

    getNumSections() {
        return Object.keys(this.viewer.scene.sectionPlanes).length;
    }

    clear() {
        this._sectionPlanesPlugin.clear();
        this._updateSectionPlanesCount();
    }

    flipSections() {
        this._sectionPlanesPlugin.flipSectionPlanes();
    }

    hideControl() {
        this._sectionPlanesPlugin.hideControl();
    }

    destroy() {
        this._sectionPlanesPlugin.destroy();
        this._sectionToolContextMenu.destroy();
        super.destroy();
    }
}

/** @private */
class NavCubeMode extends Controller {

    constructor(parent, cfg) {

        super(parent, cfg);

        if (!cfg.navCubeCanvasElement) {
            throw "Missing config: navCubeCanvasElement";
        }

        const navCubeCanvasElement = cfg.navCubeCanvasElement;

        this._navCube = new sf(this.viewer, {
            canvasElement: navCubeCanvasElement,
            fitVisible: true,
            color: "#CFCFCF"
        });

        this._navCube.setVisible(this._active);

        this.on("active", (active) => {
            this._navCube.setVisible(active);
        });
    }

    destroy() {
        this._navCube.destroy();
        super.destroy();
    }
}

/**
 * @desc Default initial properties for {@link Entity}s loaded from models accompanied by metadata.
 *
 * When loading a model, a loader plugins such as {@link GLTFLoaderPlugin} and {@link BIMServerLoaderPlugin} create
 * a tree of {@link Entity}s that represent the model. These loaders can optionally load metadata, to create
 * a {@link MetaModel} corresponding to the root {@link Entity}, with a {@link MetaObject} corresponding to each
 * object {@link Entity} within the tree.
 *
 * @private
 * @type {{String:Object}}
 */
const ModelIFCObjectColors = {
    IfcSpace: {
        opacity: 0.3
    },
    IfcWindow: { // Some IFC models have opaque windows
        opacity: 0.4
    },
    IfcOpeningElement: { // These tend to obscure windows
        opacity: 0.3
    },
    IfcPlate: { // These sometimes obscure windows
        opacity: 0.3
    }
};

/**
 * @desc Default initial properties for {@link Entity}s loaded from models accompanied by metadata.
 *
 * When loading a model, a loader plugins such as {@link GLTFLoaderPlugin} and {@link BIMServerLoaderPlugin} create
 * a tree of {@link Entity}s that represent the model. These loaders can optionally load metadata, to create
 * a {@link MetaModel} corresponding to the root {@link Entity}, with a {@link MetaObject} corresponding to each
 * object {@link Entity} within the tree.
 *
 * @private
 * @type {{String:Object}}
 */
const ViewerIFCObjectColors = {

    // Priority 0

    IfcRoof: {
        colorize: [0.837255, 0.203922, 0.270588],
        priority: 0
    },
    IfcSlab: {
        colorize: [0.637255, 0.603922, 0.670588],
        priority: 0
    },
    IfcWall: {
        colorize: [0.537255, 0.337255, 0.237255],
        priority: 0
    },
    IfcWallStandardCase: {
        colorize: [0.537255, 0.337255, 0.237255],
        priority: 0
    },
    IfcCovering: {
        colorize: [0.8470588235, 0.427450980392, 0],
        priority: 0
    },

    // Priority 1

    IfcDoor: {
        colorize: [0.637255, 0.603922, 0.670588],
        priority: 1
    },

    // Priority 2

    IfcStair: {
        colorize: [0.637255, 0.603922, 0.670588],
        priority: 2
    },
    IfcStairFlight: {
        colorize: [0.637255, 0.603922, 0.670588],
        priority: 2
    },
    IfcProxy: {
        colorize: [0.137255, 0.403922, 0.870588],
        priority: 2
    },
    IfcRamp: {
        colorize: [0.8470588235, 0.427450980392, 0],
        priority: 2
    },

    // Priority 3

    IfcColumn: {
        colorize: [0.137255, 0.403922, 0.870588],
        priority: 3
    },
    IfcBeam: {
        colorize: [0.137255, 0.403922, 0.870588],
        priority: 3
    },
    IfcCurtainWall: {
        colorize: [0.137255, 0.403922, 0.870588],
        priority: 3
    },
    IfcPlate: {
        colorize: [0.8470588235, 0.427450980392, 0, 0.5],
        opacity: 0.5,
        priority: 3
    },
    IfcTransportElement: {
        colorize: [0.8470588235, 0.427450980392, 0],
        priority: 3
    },
    IfcFooting: {
        colorize: [0.8470588235, 0.427450980392, 0],
        priority: 3
    },

    // Priority 4

    IfcRailing: {
        colorize: [0.137255, 0.403922, 0.870588],
        priority: 4
    },
    IfcFurnishingElement: {
        colorize: [0.137255, 0.403922, 0.870588],
        priority: 4
    },
    IfcFurniture: {
        colorize: [0.8470588235, 0.427450980392, 0],
        priority: 4
    },
    IfcSystemFurnitureElement: {
        colorize: [0.8470588235, 0.427450980392, 0],
        priority: 4
    },

    // Priority 5

    IfcFlowSegment: {
        colorize: [0, 0.6, 1],
        priority: 5
    },
    IfcFlowitting: {
        colorize: [0.137255, 0.403922, 0.870588],
        priority: 5
    },
    IfcFlowTerminal: {
        colorize: [0.8, 1, 0.4],
        priority: 5
    },
    IfcFlowController: {
        colorize: [0.8470588235, 0.427450980392, 0],
        priority: 5
    },
    IfcFlowFitting: {
        colorize: [1, 0.8, 0.6],
        priority: 5
    },
    IfcDuctSegment: {
        colorize: [0.8470588235, 0.427450980392, 0],
        priority: 5
    },
    IfcDistributionFlowElement: {
        colorize: [0.8470588235, 0.427450980392, 0],
        priority: 5
    },
    IfcDuctFitting: {
        colorize: [0.8470588235, 0.427450980392, 0],
        priority: 5
    },
    IfcLightFixture: {
        colorize: [0.8470588235, 0.8470588235, 0.870588],
        priority: 5
    },

    // Priority 6

    IfcAirTerminal: {
        colorize: [0.8470588235, 0.427450980392, 0],
        priority: 6
    },

    IfcOpeningElement: {
        colorize: [0.137255, 0.403922, 0.870588],
        opacity: 0.3,
        priority: 6
    },
    IfcSpace: {
        opacity: 0.5
    },

    IfcWindow: {
        colorize: [0.137255, 0.403922, 0.870588],
        opacity: 0.4,
        priority: 6 // FIXME: transparent objects need to be last in order to avoid strange wireframe effect
    },

    //

    IfcBuildingElementProxy: {
        colorize: [0.8, 0.4, 0.6]
    },

    IfcSite: {
        colorize: [0.137255, 0.403922, 0.870588]
    },

    IfcMember: {
        colorize: [0.8470588235, 0.427450980392, 0]
    },

    DEFAULT: {
        colorize: [0.5, 0.5, 0.5],
        priority: 10
    }
};

/**
 * @private
 * @param {*} cfg Configs
 * @param {Boolean} [cfg.enableEditModels=false] Set true to show Add/Edit/Delete options in the menu.
 */
class ModelsContextMenu extends a {

    constructor(cfg = {}) {

        const enableEditModels = (!!cfg.enableEditModels);

        const items = [
            [
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("modelsContextMenu.loadModel") || "Load";
                    },
                    getEnabled: (context) => {
                        return (!context.bimViewer.isModelLoaded(context.modelId));
                    },
                    doAction: (context) => {
                        context.bimViewer.loadModel(context.modelId);
                    }
                },
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("modelsContextMenu.unloadModel") || "Unload";
                    },
                    getEnabled: (context) => {
                        return context.bimViewer.isModelLoaded(context.modelId);
                    },
                    doAction: (context) => {
                        context.bimViewer.unloadModel(context.modelId);
                    }
                }
            ]
        ];

        if (enableEditModels) {

            items.push([
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("modelsContextMenu.editModel") || "Edit";
                    },
                    getEnabled: (context) => {
                        return true;
                    },
                    doAction: (context) => {
                        context.bimViewer.editModel(context.modelId);
                    }
                },
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("modelsContextMenu.deleteModel") || "Delete";
                    },
                    getEnabled: (context) => {
                        return true;
                    },
                    doAction: (context) => {
                        context.bimViewer.deleteModel(context.modelId);
                    }
                }
            ]);
        }

        items.push([
            {
                getTitle: (context) => {
                    return context.viewer.localeService.translate("modelsContextMenu.loadAllModels") || "Load All";
                },
                getEnabled: (context) => {
                    const bimViewer = context.bimViewer;
                    const modelIds = bimViewer.getModelIds();
                    const loadedModelIds = bimViewer.getLoadedModelIds();
                    return (loadedModelIds.length < modelIds.length);
                },
                doAction: (context) => {
                    context.bimViewer.loadAllModels();
                }
            },
            {
                getTitle: (context) => {
                    return context.viewer.localeService.translate("modelsContextMenu.unloadAllModels") || "Unload All";
                },
                getEnabled: (context) => {
                    const loadedModelIds = context.bimViewer.getLoadedModelIds();
                    return (loadedModelIds.length > 0);
                },
                doAction: (context) => {
                    context.bimViewer.unloadAllModels();
                }
            }
        ]);

        items.push([
            {
                getTitle: (context) => {
                    return context.viewer.localeService.translate("modelsContextMenu.clearSlices") || "Clear Slices";
                },
                getEnabled: (context) => {
                    return (context.bimViewer.getNumSections() > 0);
                },
                doAction: (context) => {
                    context.bimViewer.clearSections();
                }
            }
        ]);

        super({
            context: cfg.context,
            items: items
        });
    }
}

const tempVec3a$1 = f.vec3();

/** @private */
class ModelsExplorer extends Controller {

    constructor(parent, cfg) {

        super(parent, cfg);

        if (!cfg.modelsTabElement) {
            throw "Missing config: modelsTabElement";
        }

        if (!cfg.unloadModelsButtonElement) {
            throw "Missing config: unloadModelsButtonElement";
        }

        if (!cfg.modelsElement) {
            throw "Missing config: modelsElement";
        }

        this._enableAddModels = !!cfg.enableEditModels;
        this._modelsTabElement = cfg.modelsTabElement;
        this._loadModelsButtonElement = cfg.loadModelsButtonElement;
        this._unloadModelsButtonElement = cfg.unloadModelsButtonElement;
        this._addModelButtonElement = cfg.addModelButtonElement;
        this._modelsElement = cfg.modelsElement;
        this._modelsTabButtonElement = this._modelsTabElement.querySelector(".xeokit-tab-btn");

        if (!this._modelsTabButtonElement) {
            throw "Missing DOM element: ,xeokit-tab-btn";
        }

        this._xktLoader = new Qg(this.viewer, {
            objectDefaults: ModelIFCObjectColors
        });

        this._modelsContextMenu = new ModelsContextMenu({
            enableEditModels: cfg.enableEditModels
        });

        this._modelsInfo = {};
        this._numModels = 0;
        this._numModelsLoaded = 0;
        this._projectId = null;
    }

    loadProject(projectId, done, error) {
        this.server.getProject(projectId, (projectInfo) => {
            this.unloadProject();
            this._projectId = projectId;
            this._modelsInfo = {};
            this._numModels = 0;
            this._parseProject(projectInfo, done);
            if (this._numModelsLoaded < this._numModels) {
                this._loadModelsButtonElement.classList.remove("disabled");
            }
            if (this._numModelsLoaded > 0) {
                this._unloadModelsButtonElement.classList.remove("disabled");
            }
            if (this._enableAddModels) {
                this._addModelButtonElement.classList.remove("disabled");
            }
        }, (errMsg) => {
            this.error(errMsg);
            if (error) {
                error(errMsg);
            }
        });
    }

    _parseProject(projectInfo, done) {
        this._buildModelsMenu(projectInfo);
        this._parseViewerConfigs(projectInfo);
        this._parseViewerContent(projectInfo, () => {
            this._parseViewerState(projectInfo, () => {
                done();
            });
        });
    }

    _buildModelsMenu(projectInfo) {
        var html = "";
        const modelsInfo = projectInfo.models || [];
        this._modelsInfo = {};
        this._numModels = modelsInfo.length;
        for (let i = 0, len = modelsInfo.length; i < len; i++) {
            const modelInfo = modelsInfo[i];
            this._modelsInfo[modelInfo.id] = modelInfo;
            html += "<div class='xeokit-form-check'>";
            html += "<input id='" + modelInfo.id + "' type='checkbox' value=''><span id='span-" + modelInfo.id + "' class='disabled'>" + modelInfo.name + "</span>";
            html += "</div>";
        }
        this._modelsElement.innerHTML = html;
        for (let i = 0, len = modelsInfo.length; i < len; i++) {
            const modelInfo = modelsInfo[i];
            const modelId = modelInfo.id;
            const checkBox = document.getElementById("" + modelId);
            const span = document.getElementById("span-" + modelId);
            checkBox.addEventListener("click", () => {
                if (checkBox.checked) {
                    this.loadModel(modelId);
                } else {
                    this.unloadModel(modelInfo.id);
                }
            });
            span.addEventListener("click", () => {
                const model = this.viewer.scene.models[modelId];
                const modelLoaded = (!!model);
                if (!modelLoaded) {
                    this.loadModel(modelId);
                } else {
                    this.unloadModel(modelInfo.id);
                }
            });
            span.oncontextmenu = (e) => {
                this._modelsContextMenu.context = {
                    bimViewer: this.bimViewer,
                    viewer: this.viewer,
                    modelId: modelId
                };
                this._modelsContextMenu.show(e.pageX, e.pageY);
                e.preventDefault();
            };
        }
    }

    _parseViewerConfigs(projectInfo) {
        const viewerConfigs = projectInfo.viewerConfigs;
        if (viewerConfigs) {
            this.bimViewer.setConfigs(viewerConfigs);
        }
    }

    _parseViewerContent(projectInfo, done) {
        const viewerContent = projectInfo.viewerContent;
        if (!viewerContent) {
            done();
            return;
        }
        this._parseModelsLoaded(viewerContent, () => {
            done();
        });
    }

    _parseModelsLoaded(viewerContent, done) {
        const modelsLoaded = viewerContent.modelsLoaded;
        if (!modelsLoaded || (modelsLoaded.length === 0)) {
            done();
            return;
        }
        this._loadNextModel(modelsLoaded.slice(0), done);
    }

    _loadNextModel(modelsLoaded, done) {
        if (modelsLoaded.length === 0) {
            done();
            return;
        }
        const modelId = modelsLoaded.pop();
        this.loadModel(modelId,
            () => { // Done
                this._loadNextModel(modelsLoaded, done);
            },
            () => { // Error - recover and attempt to load next model
                this._loadNextModel(modelsLoaded, done);
            });
    }

    _parseViewerState(projectInfo, done) {
        const viewerState = projectInfo.viewerState;
        if (!viewerState) {
            done();
            return;
        }
        this.bimViewer.setViewerState(viewerState, done);
    }

    unloadProject() {
        if (!this._projectId) {
            return;
        }
        const models = this.viewer.scene.models;
        for (var modelId in models) {
            if (models.hasOwnProperty(modelId)) {
                const model = models[modelId];
                model.destroy();
            }
        }
        this._modelsElement.innerHTML = "";
        this._numModelsLoaded = 0;

        this._loadModelsButtonElement.classList.add("disabled");
        this._unloadModelsButtonElement.classList.add("disabled");
        if (this._enableAddModels) {
            this._addModelButtonElement.classList.add("disabled");
        }
        const lastProjectId = this._projectId;
        this._projectId = null;
        this.fire("projectUnloaded", {
            projectId: lastProjectId
        });
    }

    getLoadedProjectId() {
        return this._projectId;
    }

    getModelIds() {
        return Object.keys(this._modelsInfo);
    }

    loadModel(modelId, done, error) {
        if (!this._projectId) {
            const errMsg = "No project currently loaded";
            this.error(errMsg);
            if (error) {
                error(errMsg);
            }
            return;
        }
        const modelInfo = this._modelsInfo[modelId];
        if (!modelInfo) {
            const errMsg = "Model not in currently loaded project";
            this.error(errMsg);
            if (error) {
                error(errMsg);
            }
            return;
        }

        this.bimViewer._busyModal.show(`${this.viewer.localeService.translate("busyModal.loading") || "Loading"} ${modelInfo.name}`);

        const externalMetadata = this.bimViewer.getConfig("externalMetadata");

        if (externalMetadata) {
            this.server.getMetadata(this._projectId, modelId, (json) => {
                    this._loadGeometry(modelId, modelInfo, json, done, error);
                },
                (errMsg) => {
                    this.bimViewer._busyModal.hide();
                    this.error(errMsg);
                    if (error) {
                        error(errMsg);
                    }
                });
        } else {
            this._loadGeometry(modelId, modelInfo, null, done, error);
        }
    }

    _loadGeometry(modelId, modelInfo, json, done, error) {
        this.server.getGeometry(this._projectId, modelId, (arraybuffer) => {
                const objectColorSource = (modelInfo.objectColorSource || this.bimViewer.getObjectColorSource());
                const objectDefaults = (objectColorSource === "model") ? ModelIFCObjectColors : ViewerIFCObjectColors;
                const model = this._xktLoader.load({
                    id: modelId,
                    metaModelData: json,
                    xkt: arraybuffer,
                    objectDefaults: objectDefaults,
                    excludeUnclassifiedObjects: true,
                    origin: modelInfo.origin || modelInfo.position,
                    scale: modelInfo.scale,
                    rotation: modelInfo.rotation,
                    matrix: modelInfo.matrix,
                    edges: (modelInfo.edges !== false),
                    saoEnabled: modelInfo.saoEnabled,
                    pbrEnabled: modelInfo.pbrEnabled,
                    backfaces: modelInfo.backfaces,
                    globalizeObjectIds: modelInfo.globalizeObjectIds,
                    reuseGeometries: (modelInfo.reuseGeometries !== false)
                });
                model.on("loaded", () => {
                    const checkbox = document.getElementById("" + modelId);
                    checkbox.checked = true;
                    const scene = this.viewer.scene;
                    this._numModelsLoaded++;
                    this._unloadModelsButtonElement.classList.remove("disabled");
                    if (this._numModelsLoaded < this._numModels) {
                        this._loadModelsButtonElement.classList.remove("disabled");
                    } else {
                        this._loadModelsButtonElement.classList.add("disabled");
                    }
                    if (this._numModelsLoaded === 1) { // Jump camera to view-fit first model loaded
                        this._jumpToInitialCamera();
                        this.fire("modelLoaded", modelId);
                        this.bimViewer._busyModal.hide();
                        if (done) {
                            done();
                        }
                    } else {
                        this.fire("modelLoaded", modelId);
                        this.bimViewer._busyModal.hide();
                        if (done) {
                            done();
                        }
                    }
                });
            },
            (errMsg) => {
                this.bimViewer._busyModal.hide();
                this.error(errMsg);
                if (error) {
                    error(errMsg);
                }
            });
    }

    _jumpToInitialCamera() {
        const viewer = this.viewer;
        const scene = viewer.scene;
        const aabb = scene.getAABB(scene.visibleObjectIds);
        const diag = f.getAABB3Diag(aabb);
        const center = f.getAABB3Center(aabb, tempVec3a$1);
        const camera = scene.camera;
        const fitFOV = camera.perspective.fov;
        const dist = Math.abs(diag / Math.tan(45 * f.DEGTORAD));
        const dir = f.normalizeVec3((camera.yUp) ? [-0.5, -0.7071, -0.5] : [-1, 1, -1]);
        const up = f.normalizeVec3((camera.yUp) ? [-0.5, 0.7071, -0.5] : [-1, 1, 1]);
        viewer.cameraControl.pivotPos = center;
        viewer.cameraControl.planView = false;
        viewer.cameraFlight.jumpTo({
            look: center,
            eye: [center[0] - (dist * dir[0]), center[1] - (dist * dir[1]), center[2] - (dist * dir[2])],
            up: up,
            orthoScale: diag * 1.1
        });
    }

    unloadModel(modelId) {
        const model = this.viewer.scene.models[modelId];
        if (!model) {
            this.error("Model not loaded: " + modelId);
            return;
        }
        model.destroy();
        const checkbox = document.getElementById("" + modelId);
        checkbox.checked = false;
        const span = document.getElementById("span-" + modelId);
        this._numModelsLoaded--;
        if (this._numModelsLoaded > 0) {
            this._unloadModelsButtonElement.classList.remove("disabled");
        } else {
            this._unloadModelsButtonElement.classList.add("disabled");
        }
        if (this._numModelsLoaded < this._numModels) {
            this._loadModelsButtonElement.classList.remove("disabled");
        } else {
            this._loadModelsButtonElement.classList.add("disabled");
        }
        this.fire("modelUnloaded", modelId);
    }

    unloadAllModels() {
        const models = this.viewer.scene.models;
        const modelIds = Object.keys(models);
        for (var i = 0, len = modelIds.length; i < len; i++) {
            const modelId = modelIds[i];
            this.unloadModel(modelId);
        }
    }

    getNumModelsLoaded() {
        return this._numModelsLoaded;
    }

    _getLoadedModelIds() {
        return Object.keys(this.viewer.scene.models);
    }

    isModelLoaded(modelId) {
        return (!!this.viewer.scene.models[modelId]);
    }

    getModelsInfo() {
        return this._modelsInfo;
    }

    getModelInfo(modelId) {
        return this._modelsInfo[modelId];
    }

    setEnabled(enabled) {
        if (!enabled) {
            this._modelsTabButtonElement.classList.add("disabled");
            this._unloadModelsButtonElement.classList.add("disabled");
        } else {
            this._modelsTabButtonElement.classList.remove("disabled");
            this._unloadModelsButtonElement.classList.remove("disabled");
        }
    }

    /** @private */
    destroy() {
        super.destroy();
        this._xktLoader.destroy();
    }
}

const tempVec3$2 = f.vec3();

/**
 * @private
 */
class TreeViewContextMenu extends a {

    constructor(bimViewer) {
        super();
        this._bimViewer = bimViewer;
        this._buildMenu();
    }

    _buildMenu() {

        const showObjectItems = [];
        const focusObjectItems = [];

        if (this._bimViewer._enablePropertiesInspector) {
            showObjectItems.push({
                getTitle: (context) => {
                    return context.viewer.localeService.translate("treeViewContextMenu.inspectProperties") || "Inspect Properties";
                },
                getShown(context) {
                    return !!context.viewer.metaScene.metaObjects[context.treeViewNode.objectId];
                },
                doAction: (context) => {
                    const objectId = context.treeViewNode.objectId;
                    context.bimViewer.showObjectProperties(objectId);
                }
            });
        }

        focusObjectItems.push(...[
            {
                getTitle: (context) => {
                    return context.viewer.localeService.translate("treeViewContextMenu.viewFit") || "View Fit";
                },
                doAction: function (context) {
                    const viewer = context.viewer;
                    const scene = viewer.scene;
                    const objectIds = [];
                    context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                        if (treeViewNode.objectId) {
                            objectIds.push(treeViewNode.objectId);
                        }
                    });
                    scene.setObjectsVisible(objectIds, true);
                    scene.setObjectsHighlighted(objectIds, true);
                    const aabb = scene.getAABB(objectIds);
                    viewer.cameraFlight.flyTo({
                        aabb: aabb,
                        duration: 0.5
                    }, () => {
                        setTimeout(function () {
                            scene.setObjectsHighlighted(scene.highlightedObjectIds, false);
                        }, 500);
                    });
                    viewer.cameraControl.pivotPos = f.getAABB3Center(aabb);
                }
            },
            {
                getTitle: (context) => {
                    return context.viewer.localeService.translate("treeViewContextMenu.viewFitAll") || "View Fit All";
                },
                doAction: function (context) {
                    const viewer = context.viewer;
                    const scene = viewer.scene;
                    const sceneAABB = scene.getAABB(scene.visibleObjectIds);
                    viewer.cameraFlight.flyTo({
                        aabb: sceneAABB,
                        duration: 0.5
                    });
                    viewer.cameraControl.pivotPos = f.getAABB3Center(sceneAABB);
                }
            }
        ]);

        this.items = [
            showObjectItems,
            focusObjectItems,
            [
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("treeViewContextMenu.isolate") || "Isolate";
                    },
                    doAction: function (context) {
                        const viewer = context.viewer;
                        const scene = viewer.scene;
                        const objectIds = [];
                        context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                            if (treeViewNode.objectId) {
                                objectIds.push(treeViewNode.objectId);
                            }
                        });
                        const aabb = scene.getAABB(objectIds);

                        viewer.cameraControl.pivotPos = f.getAABB3Center(aabb, tempVec3$2);

                        scene.setObjectsXRayed(scene.xrayedObjectIds, false);
                        scene.setObjectsVisible(scene.visibleObjectIds, false);
                        // scene.setObjectsPickable(scene.objectIds, false);
                        scene.setObjectsSelected(scene.selectedObjectIds, false);

                        scene.setObjectsVisible(objectIds, true);
                        // scene.setObjectsPickable(objectIds, true);

                        viewer.cameraFlight.flyTo({
                            aabb: aabb
                        }, () => {
                        });
                    }
                }
            ],
            [
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("treeViewContextMenu.hide") || "Hide";
                    },
                    doAction: function (context) {
                        context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                            if (treeViewNode.objectId) {
                                const entity = context.viewer.scene.objects[treeViewNode.objectId];
                                if (entity) {
                                    entity.visible = false;
                                }
                            }
                        });
                    }
                },
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("treeViewContextMenu.hideOthers") || "Hide Others";
                    },
                    doAction: function (context) {
                        const scene = context.viewer.scene;
                        scene.setObjectsVisible(scene.visibleObjectIds, false);
                        scene.setObjectsPickable(scene.xrayedObjectIds, true);
                        scene.setObjectsXRayed(scene.xrayedObjectIds, false);
                        context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                            if (treeViewNode.objectId) {
                                const entity = scene.objects[treeViewNode.objectId];
                                if (entity) {
                                    entity.visible = true;
                                }
                            }
                        });
                    }
                },
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("treeViewContextMenu.hideAll") || "Hide All";
                    },
                    getEnabled: function (context) {
                        return (context.viewer.scene.visibleObjectIds.length > 0);
                    },
                    doAction: function (context) {
                        context.viewer.scene.setObjectsVisible(context.viewer.scene.visibleObjectIds, false);
                    }
                }
            ],
            [
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("treeViewContextMenu.show") || "Show";
                    },
                    doAction: function (context) {
                        context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                            if (treeViewNode.objectId) {
                                const entity = context.viewer.scene.objects[treeViewNode.objectId];
                                if (entity) {
                                    entity.visible = true;
                                    if (entity.xrayed) {
                                        entity.pickable = true;
                                    }
                                    entity.xrayed = false;
                                    entity.selected = false;
                                }
                            }
                        });
                    }
                },
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("treeViewContextMenu.showOthers") || "Shows Others";
                    },
                    doAction: function (context) {
                        const scene = context.viewer.scene;
                        scene.setObjectsVisible(scene.objectIds, true);
                        scene.setObjectsPickable(scene.xrayedObjectIds, true);
                        scene.setObjectsXRayed(scene.xrayedObjectIds, false);
                        context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                            if (treeViewNode.objectId) {
                                const entity = scene.objects[treeViewNode.objectId];
                                if (entity) {
                                    entity.visible = false;
                                }
                            }
                        });
                    }
                },
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("treeViewContextMenu.showAll") || "Show All";
                    },
                    getEnabled: function (context) {
                        const scene = context.viewer.scene;
                        return ((scene.numVisibleObjects < scene.numObjects) || (context.viewer.scene.numXRayedObjects > 0));
                    },
                    doAction: function (context) {
                        const scene = context.viewer.scene;
                        scene.setObjectsVisible(scene.objectIds, true);
                        scene.setObjectsPickable(scene.xrayedObjectIds, true);
                        scene.setObjectsXRayed(scene.xrayedObjectIds, false);
                    }
                }
            ],
            [
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("treeViewContextMenu.xray") || "X-Ray";
                    },
                    doAction: function (context) {
                        context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                            if (treeViewNode.objectId) {
                                const entity = context.viewer.scene.objects[treeViewNode.objectId];
                                if (entity) {
                                    entity.selected = false;
                                    entity.xrayed = true;
                                    entity.visible = true;
                                    entity.pickable = context.bimViewer.getConfig("xrayPickable");
                                }
                            }
                        });
                    }
                },
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("treeViewContextMenu.undoXray") || "Undo X-Ray";
                    },
                    doAction: function (context) {
                        context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                            if (treeViewNode.objectId) {
                                const entity = context.viewer.scene.objects[treeViewNode.objectId];
                                if (entity) {
                                    entity.xrayed = false;
                                    entity.pickable = true;
                                }
                            }
                        });
                    }
                },
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("treeViewContextMenu.xrayOthers") || "X-Ray Others";
                    },
                    doAction: function (context) {
                        const scene = context.viewer.scene;
                        scene.setObjectsVisible(scene.objectIds, true);
                        if (!context.bimViewer.getConfig("xrayPickable")) {
                            scene.setObjectsPickable(scene.objectIds, false);
                        }
                        scene.setObjectsXRayed(scene.objectIds, true);
                        scene.setObjectsSelected(scene.selectedObjectIds, false);
                        context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                            if (treeViewNode.objectId) {
                                const entity = scene.objects[treeViewNode.objectId];
                                if (entity) {
                                    entity.xrayed = false;
                                    entity.pickable = true;
                                }
                            }
                        });
                    }
                },
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("treeViewContextMenu.xrayAll") || "X-Ray All";
                    },
                    doAction: function (context) {
                        const scene = context.viewer.scene;
                        scene.setObjectsVisible(scene.objectIds, true);
                        scene.setObjectsXRayed(scene.objectIds, true);
                        scene.setObjectsSelected(scene.selectedObjectIds, false);
                        scene.setObjectsPickable(scene.objectIds, false);
                    }
                },
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("treeViewContextMenu.xrayNone") || "X-Ray None";
                    },
                    getEnabled: function (context) {
                        return (context.viewer.scene.numXRayedObjects > 0);
                    },
                    doAction: function (context) {
                        const scene = context.viewer.scene;
                        const xrayedObjectIds = scene.xrayedObjectIds;
                        scene.setObjectsPickable(xrayedObjectIds, true);
                        scene.setObjectsXRayed(xrayedObjectIds, false);
                    }
                }
            ],
            [
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("treeViewContextMenu.select") || "Select";
                    },
                    doAction: function (context) {
                        context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                            if (treeViewNode.objectId) {
                                const entity = context.viewer.scene.objects[treeViewNode.objectId];
                                if (entity) {
                                    entity.selected = true;
                                    entity.visible = true;
                                }
                            }
                        });
                    }
                },
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("treeViewContextMenu.undoSelect") || "Undo Select";
                    },
                    doAction: function (context) {
                        context.treeViewPlugin.withNodeTree(context.treeViewNode, (treeViewNode) => {
                            if (treeViewNode.objectId) {
                                const entity = context.viewer.scene.objects[treeViewNode.objectId];
                                if (entity) {
                                    entity.selected = false;
                                }
                            }
                        });
                    }
                },
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("treeViewContextMenu.selectNone") || "Select None";
                    },
                    getEnabled: function (context) {
                        return (context.viewer.scene.numSelectedObjects > 0);
                    },
                    doAction: function (context) {
                        context.viewer.scene.setObjectsSelected(context.viewer.scene.selectedObjectIds, false);
                    }
                }
            ],
            [
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("treeViewContextMenu.clearSlices") || "Clear Slices";
                    },
                    getEnabled: function (context) {
                        return (context.bimViewer.getNumSections() > 0);
                    },
                    doAction: function (context) {
                        context.bimViewer.clearSections();
                    }
                }]
        ];
    }
}

/** @private */
class ObjectsExplorer extends Controller {

    constructor(parent, cfg = {}) {

        super(parent);

        if (!cfg.objectsTabElement) {
            throw "Missing config: objectsTabElement";
        }

        if (!cfg.showAllObjectsButtonElement) {
            throw "Missing config: showAllObjectsButtonElement";
        }

        if (!cfg.hideAllObjectsButtonElement) {
            throw "Missing config: hideAllObjectsButtonElement";
        }

        if (!cfg.objectsElement) {
            throw "Missing config: objectsElement";
        }

        this._objectsTabElement = cfg.objectsTabElement;
        this._showAllObjectsButtonElement = cfg.showAllObjectsButtonElement;
        this._hideAllObjectsButtonElement = cfg.hideAllObjectsButtonElement;
        this._objectsTabButtonElement = this._objectsTabElement.querySelector(".xeokit-tab-btn");

        if (!this._objectsTabButtonElement) {
            throw "Missing DOM element: ,xeokit-tab-btn";
        }

        const objectsElement = cfg.objectsElement;

        this._treeView = new Yf(this.viewer, {
            containerElement: objectsElement,
            hierarchy: "containment",
            autoAddModels: false,
            pruneEmptyNodes: true
        });

        this._treeViewContextMenu = new TreeViewContextMenu(this.bimViewer);

        this._treeView.on("contextmenu", (e) => {
            this._treeViewContextMenu.context = {
                bimViewer: this.bimViewer,
                viewer: e.viewer,
                treeViewPlugin: e.treeViewPlugin,
                treeViewNode: e.treeViewNode
            };
            this._treeViewContextMenu.show(e.event.pageX, e.event.pageY);
        });

        this._treeView.on("nodeTitleClicked", (e) => {
            const scene = this.viewer.scene;
            const objectIds = [];
            e.treeViewPlugin.withNodeTree(e.treeViewNode, (treeViewNode) => {
                if (treeViewNode.objectId) {
                    objectIds.push(treeViewNode.objectId);
                }
            });
            const checked = e.treeViewNode.checked;
            if (checked) {
                scene.setObjectsXRayed(objectIds, false);
                scene.setObjectsVisible(objectIds, false);
                scene.setObjectsPickable(objectIds, true);
            } else {
                scene.setObjectsXRayed(objectIds, false);
                scene.setObjectsVisible(objectIds, true);
                scene.setObjectsPickable(objectIds, true);
            }
        });

        this._onModelLoaded = this.viewer.scene.on("modelLoaded", (modelId) => {
            if (this.viewer.metaScene.metaModels[modelId]) {
                const modelInfo = this.bimViewer._modelsExplorer.getModelInfo(modelId);
                if (!modelInfo) {
                    return;
                }
                this._treeView.addModel(modelId, {
                    rootName: modelInfo.name
                });
            }
        });

        this._onModelUnloaded = this.viewer.scene.on("modelUnloaded", (modelId) => {
            if (this.viewer.metaScene.metaModels[modelId]) {
                this._treeView.removeModel(modelId);
            }
        });

        this.bimViewer.on("reset", () => {
            this._treeView.collapse();
        });
    }

    setEnabled(enabled) {
        if (!enabled) {
            this._objectsTabButtonElement.classList.add("disabled");
            this._showAllObjectsButtonElement.classList.add("disabled");
            this._hideAllObjectsButtonElement.classList.add("disabled");
        } else {
            this._objectsTabButtonElement.classList.remove("disabled");
            this._showAllObjectsButtonElement.classList.remove("disabled");
            this._hideAllObjectsButtonElement.classList.remove("disabled");
        }
    }

    expandTreeViewToDepth(depth) {
        this._treeView.expandToDepth(depth);
    }

    showNodeInTreeView(objectId) {
        this._treeView.collapse();
        this._treeView.showNode(objectId);
    }

    unShowNodeInTreeView() {
        this._treeView.unShowNode();
    }

    destroy() {
        super.destroy();
        this._treeView.destroy();
        this._treeViewContextMenu.destroy();
        this.viewer.scene.off(this._onModelLoaded);
        this.viewer.scene.off(this._onModelUnloaded);
    }
}

/** @private */
class ClassesExplorer extends Controller {

    constructor(parent, cfg = {}) {

        super(parent);

        if (!cfg.classesTabElement) {
            throw "Missing config: classesTabElement";
        }

        if (!cfg.showAllClassesButtonElement) {
            throw "Missing config: showAllClassesButtonElement";
        }

        if (!cfg.hideAllClassesButtonElement) {
            throw "Missing config: hideAllClassesButtonElement";
        }

        if (!cfg.classesElement) {
            throw "Missing config: classesElement";
        }

        this._classesTabElement = cfg.classesTabElement;
        this._showAllClassesButtonElement = cfg.showAllClassesButtonElement;
        this._hideAllClassesButtonElement = cfg.hideAllClassesButtonElement;
        this._classesTabButtonElement = this._classesTabElement.querySelector(".xeokit-tab-btn");

        if (!this._classesTabButtonElement) {
            throw "Missing DOM element: xeokit-tab-btn";
        }

        const classesElement = cfg.classesElement;

        this._treeView = new Yf(this.viewer, {
            containerElement: classesElement,
            hierarchy: "types",
            autoAddModels: false,
            pruneEmptyNodes: true
        });

        this._treeViewContextMenu = new TreeViewContextMenu(this.bimViewer);

        this._treeView.on("contextmenu", (e) => {
            this._treeViewContextMenu.context = {
                bimViewer: this.bimViewer,
                viewer: e.viewer,
                treeViewPlugin: e.treeViewPlugin,
                treeViewNode: e.treeViewNode
            };
            this._treeViewContextMenu.show(e.event.pageX, e.event.pageY);
        });

        this._treeView.on("nodeTitleClicked", (e) => {
            const scene = this.viewer.scene;
            const objectIds = [];
            e.treeViewPlugin.withNodeTree(e.treeViewNode, (treeViewNode) => {
                if (treeViewNode.objectId) {
                    objectIds.push(treeViewNode.objectId);
                }
            });
            const checked = e.treeViewNode.checked;
            if (checked) {
                scene.setObjectsXRayed(objectIds, false);
                scene.setObjectsVisible(objectIds, false);
                scene.setObjectsPickable(objectIds, true);
            } else {
                scene.setObjectsXRayed(objectIds, false);
                scene.setObjectsVisible(objectIds, true);
                scene.setObjectsPickable(objectIds, true);
            }
        });

        this._onModelLoaded = this.viewer.scene.on("modelLoaded", (modelId) => {
            if (this.viewer.metaScene.metaModels[modelId]) {
                const modelInfo = this.bimViewer._modelsExplorer.getModelInfo(modelId);
                if (!modelInfo) {
                    return;
                }
                this._treeView.addModel(modelId, {
                    rootName: modelInfo.name
                });
            }
        });

        this._onModelUnloaded = this.viewer.scene.on("modelUnloaded", (modelId) => {
            if (this.viewer.metaScene.metaModels[modelId]) {
                this._treeView.removeModel(modelId);
            }
        });

        this.bimViewer.on("reset", () => {
            this._treeView.collapse();
        });
    }

    setEnabled(enabled) {
        if (!enabled) {
            this._classesTabButtonElement.classList.add("disabled");
            this._showAllClassesButtonElement.classList.add("disabled");
            this._hideAllClassesButtonElement.classList.add("disabled");
        } else {
            this._classesTabButtonElement.classList.remove("disabled");
            this._showAllClassesButtonElement.classList.remove("disabled");
            this._hideAllClassesButtonElement.classList.remove("disabled");
        }
    }

    expandTreeViewToDepth(depth) {
        this._treeView.expandToDepth(depth);
    }

    showNodeInTreeView(objectId) {
        this._treeView.collapse();
        this._treeView.showNode(objectId);
    }

    unShowNodeInTreeView() {
        this._treeView.unShowNode();
    }

    destroy() {
        super.destroy();
        this._treeView.destroy();
        this._treeViewContextMenu.destroy();
        this.viewer.scene.off(this._onModelLoaded);
        this.viewer.scene.off(this._onModelUnloaded);
    }
}

const tempVec3$3 = f.vec3();

/** @private */
class StoreysExplorer extends Controller {

    constructor(parent, cfg = {}) {

        super(parent);

        if (!cfg.storeysTabElement) {
            throw "Missing config: storeysTabElement";
        }

        if (!cfg.showAllStoreysButtonElement) {
            throw "Missing config: showAllStoreysButtonElement";
        }

        if (!cfg.hideAllStoreysButtonElement) {
            throw "Missing config: hideAllStoreysButtonElement";
        }

        if (!cfg.storeysElement) {
            throw "Missing config: storeysElement";
        }

        this._storeysTabElement = cfg.storeysTabElement;
        this._showAllStoreysButtonElement = cfg.showAllStoreysButtonElement;
        this._hideAllStoreysButtonElement = cfg.hideAllStoreysButtonElement;
        this._storeysTabButtonElement = this._storeysTabElement.querySelector(".xeokit-tab-btn");

        if (!this._storeysTabButtonElement) {
            throw "Missing DOM element: .xeokit-tab-btn";
        }

        const storeysElement = cfg.storeysElement;

        this._treeView = new Yf(this.viewer, {
            containerElement: storeysElement,
            autoAddModels: false,
            hierarchy: "storeys",
            autoExpandDepth: 1
        });

        this._treeViewContextMenu = new TreeViewContextMenu(this.bimViewer);

        this._treeView.on("contextmenu", (e) => {
            this._treeViewContextMenu.context = {
                bimViewer: this.bimViewer,
                viewer: e.viewer,
                treeViewPlugin: e.treeViewPlugin,
                treeViewNode: e.treeViewNode,
                pruneEmptyNodes: true
            };
            this._treeViewContextMenu.show(e.event.pageX, e.event.pageY);
        });

        this._treeView.on("nodeTitleClicked", (e) => {
            const scene = this.viewer.scene;
            const objectIds = [];
            e.treeViewPlugin.withNodeTree(e.treeViewNode, (treeViewNode) => {
                if (treeViewNode.objectId) {
                    objectIds.push(treeViewNode.objectId);
                }
            });
            const checked = e.treeViewNode.checked;
            if (checked) {
                scene.setObjectsXRayed(objectIds, false);
                scene.setObjectsVisible(objectIds, false);
                scene.setObjectsPickable(objectIds, true);
            } else {
                scene.setObjectsXRayed(objectIds, false);
                scene.setObjectsVisible(objectIds, true);
                scene.setObjectsPickable(objectIds, true);
            }
        });

        this._onModelLoaded = this.viewer.scene.on("modelLoaded", (modelId) =>{
            const modelInfo = this.bimViewer._modelsExplorer.getModelInfo(modelId);
            if (!modelInfo) {
                return;
            }
            this._treeView.addModel(modelId, {
                rootName: modelInfo.name
            });
        });

        this._onModelUnloaded = this.viewer.scene.on("modelUnloaded", (modelId) => {
            if (this.viewer.metaScene.metaModels[modelId]) {
                this._treeView.removeModel(modelId);
            }
        });

        this.bimViewer.on("reset", () => {
            this._treeView.collapse();
            this._treeView.expandToDepth(1);
        });
    }

    setEnabled(enabled) {
        if (!enabled) {
            this._storeysTabButtonElement.classList.add("disabled");
            this._showAllStoreysButtonElement.classList.add("disabled");
            this._hideAllStoreysButtonElement.classList.add("disabled");
        } else {
            this._storeysTabButtonElement.classList.remove("disabled");
            this._showAllStoreysButtonElement.classList.remove("disabled");
            this._hideAllStoreysButtonElement.classList.remove("disabled");
        }
    }

    expandTreeViewToDepth(depth) {
        this._treeView.expandToDepth(depth);
    }

    showNodeInTreeView(objectId) {
        this._treeView.collapse();
        this._treeView.showNode(objectId);
    }

    unShowNodeInTreeView() {
        this._treeView.unShowNode();
    }

    selectStorey(storeyObjectId, done) {
        const metaScene = this.viewer.metaScene;
        const storeyMetaObject = metaScene.metaObjects[storeyObjectId];
        if (!storeyMetaObject) {
            this.error("selectStorey() - object is not found: '" + storeyObjectId + "'");
            return;
        }
        if (storeyMetaObject.type !== "IfcBuildingStorey") {
            this.error("selectStorey() - object is not found: '" + storeyObjectId + "'");
            return;
        }
        const objectIds = storeyMetaObject.getObjectIDsInSubtree();
        this._selectObjects(objectIds, done);
    }

    _selectObjects(objectIds, done) {
        const scene = this.viewer.scene;
        const aabb = scene.getAABB(objectIds);

        this.viewer.cameraControl.pivotPos = f.getAABB3Center(aabb, tempVec3$3);

        if (done) {

            scene.setObjectsXRayed(scene.objectIds, true);
            scene.setObjectsVisible(scene.objectIds, true);
            scene.setObjectsPickable(scene.objectIds, false);
            scene.setObjectsSelected(scene.selectedObjectIds, false);

            scene.setObjectsXRayed(objectIds, false);
            scene.setObjectsVisible(objectIds, true);
            scene.setObjectsPickable(objectIds, true);

            this.viewer.cameraFlight.flyTo({
                aabb: aabb
            }, () => {
                setTimeout(function () {
                    scene.setObjectsVisible(scene.xrayedObjectIds, false);
                    scene.setObjectsXRayed(scene.xrayedObjectIds, false);
                }, 500);
                done();
            });
        } else {

            scene.setObjectsVisible(scene.objectIds, false);
            scene.setObjectsPickable(scene.xrayedObjectIds, true);
            scene.setObjectsXRayed(scene.xrayedObjectIds, false);
            scene.setObjectsSelected(scene.selectedObjectIds, false);

            scene.setObjectsVisible(objectIds, true);

            this.viewer.cameraFlight.jumpTo({
                aabb: aabb
            });
        }
    }

    destroy() {
        super.destroy();
        this._treeView.destroy();
        this._treeViewContextMenu.destroy();
        this.viewer.scene.off(this._onModelLoaded);
        this.viewer.scene.off(this._onModelUnloaded);
    }
}

const tempVec3a$2 = f.vec3();

/** @private */
class ThreeDMode extends Controller {

    constructor(parent, cfg) {

        super(parent, cfg);

        if (!cfg.buttonElement) {
            throw "Missing config: buttonElement";
        }

        this._saveOrthoActive = null;
        this._buttonElement = cfg.buttonElement;

        this._cameraControlNavModeMediator = cfg.cameraControlNavModeMediator;

        this._active = false;

        this.on("enabled", (enabled) => {
            if (!enabled) {
                this._buttonElement.classList.add("disabled");
            } else {
                this._buttonElement.classList.remove("disabled");
            }
        });

        this._buttonElement.addEventListener("click", (event) => {
            if (this.getEnabled()) {
                this.bimViewer._sectionTool.hideControl();
                this.setActive(!this.getActive(), () => { // Animated
                });
            }
            event.preventDefault();
        });

        this.bimViewer.on("reset", () => {
            this.setActive(true, () => { // Animated
            });
        });
    }

    setEnabled(enabled) {
        super.setEnabled(enabled);
        this._saveOrthoActive = this.bimViewer._orthoMode.getActive();
    }

    setActive(active, done) {
        if (this._active === active) {
            if (done) {
                done();
            }
            return;
        }
        this._active = active;
        if (active) {
            this._buttonElement.classList.add("active");
            if (done) {
                this._enterThreeDMode(() => {
                    this.fire("active", this._active);
                    done();
                });
            } else {
                this._enterThreeDMode();
                this.fire("active", this._active);
            }
        } else {
            this._buttonElement.classList.remove("active");
            if (done) {
                this._exitThreeDMode(() => {
                    this.fire("active", this._active);
                    done();
                });
            } else {
                this._exitThreeDMode();
                this.fire("active", this._active);
            }
        }
    }

    _enterThreeDMode(done) {

        const viewer = this.viewer;
        const scene = viewer.scene;
        const aabb = scene.getAABB(scene.visibleObjectIds);
        const diag = f.getAABB3Diag(aabb);
        const center = f.getAABB3Center(aabb, tempVec3a$2);
        const dist = Math.abs(diag / Math.tan(65.0 / 2));     // TODO: fovy match with CameraFlight
        const camera = scene.camera;
        const dir = (camera.yUp) ? [-1, -1, -1] : [1, 1, 1];
        const up = (camera.yUp) ? [-1, 1, -1] : [-1, 1, 1];

        viewer.cameraControl.pivotPos = center;

        this.bimViewer._navCubeMode.setActive(true);
        this.bimViewer._firstPersonMode.setEnabled(true);
        this._cameraControlNavModeMediator.setThreeDModeActive(true);
        this.bimViewer._sectionTool.setEnabled(true);
        this.bimViewer._orthoMode.setEnabled(true);

        if (done) {
            viewer.cameraFlight.flyTo({
                look: center,
                eye: [center[0] - (dist * dir[0]), center[1] - (dist * dir[1]), center[2] - (dist * dir[2])],
                up: up,
                orthoScale: diag * 1.3,
                duration: 1,
                projection: this._saveOrthoActive ? "ortho" : "perspective"
            }, () => {
                done();
            });
        } else {
            viewer.cameraFlight.jumpTo({
                look: center,
                eye: [center[0] - (dist * dir[0]), center[1] - (dist * dir[1]), center[2] - (dist * dir[2])],
                up: up,
                orthoScale: diag * 1.3,
                projection: this._saveOrthoActive ? "ortho" : "perspective"
            });
        }
    }

    _exitThreeDMode(done) {

        const viewer = this.viewer;
        const scene = viewer.scene;
        const camera = scene.camera;
        const aabb = scene.getAABB(scene.visibleObjectIds);
        const look2 = f.getAABB3Center(aabb);
        const diag = f.getAABB3Diag(aabb);
        const fitFOV = 45; // fitFOV;
        const sca = Math.abs(diag / Math.tan(fitFOV * f.DEGTORAD));
        const orthoScale2 = diag * 1.3;
        const eye2 = tempVec3a$2;

        eye2[0] = look2[0] + (camera.worldUp[0] * sca);
        eye2[1] = look2[1] + (camera.worldUp[1] * sca);
        eye2[2] = look2[2] + (camera.worldUp[2] * sca);

        const up2 = f.mulVec3Scalar(camera.worldForward, -1, []);

        this.bimViewer._sectionTool.setActive(false);
        this.bimViewer._firstPersonMode.setEnabled(false);

        this._saveOrthoActive = this.bimViewer._orthoMode.getActive();
         this.bimViewer._orthoMode.setEnabled(false);

        this._cameraControlNavModeMediator.setThreeDModeActive(false);

        if (done) {
            viewer.cameraFlight.flyTo({
                eye: eye2,
                look: look2,
                up: up2,
                orthoScale: orthoScale2,
                projection: "ortho"
            }, () => {
                this.bimViewer._navCubeMode.setActive(false);
            });
        } else {
            viewer.cameraFlight.jumpTo({
                eye: eye2,
                look: look2,
                up: up2,
                orthoScale: orthoScale2,
                projection: "ortho"
            });
            this.bimViewer._navCubeMode.setActive(false);
        }
    }
}

/**
 * @private
 */
class ObjectContextMenu extends a {

    constructor(bimViewer) {
        super();
        this._bimViewer = bimViewer;
        this._buildMenu();
    }

    _buildMenu() {

        const showObjectItems = [];
        const focusObjectItems = [];

        if (this._bimViewer._enablePropertiesInspector) {
            showObjectItems.push(...[{
                getTitle: (context) => {
                    return context.viewer.localeService.translate("objectContextMenu.inspectProperties") || "Inspect Properties";
                },
                doAction: (context) => {
                    const objectId = context.entity.id;
                    context.bimViewer.showObjectProperties(objectId);
                }
            }]);
        }

        showObjectItems.push(...[
            {
                getTitle: (context) => {
                    return context.viewer.localeService.translate("objectContextMenu.showInTree") || "Show in Explorer";
                },
                doAction: (context) => {
                    const objectId = context.entity.id;
                    context.showObjectInExplorers(objectId);
                }
            }
        ]);

        focusObjectItems.push(...[
            {
                getTitle: (context) => {
                    return context.viewer.localeService.translate("objectContextMenu.viewFit") || "View Fit";
                },
                doAction: (context) => {
                    const viewer = context.viewer;
                    const scene = viewer.scene;
                    const entity = context.entity;
                    viewer.cameraFlight.flyTo({
                        aabb: entity.aabb,
                        duration: 0.5
                    }, () => {
                        setTimeout(function () {
                            scene.setObjectsHighlighted(scene.highlightedObjectIds, false);
                        }, 500);
                    });
                    viewer.cameraControl.pivotPos = f.getAABB3Center(entity.aabb);
                }
            },
            {
                getTitle: (context) => {
                    return context.viewer.localeService.translate("objectContextMenu.viewFitAll") || "View Fit All";
                },
                doAction: (context) => {
                    const viewer = context.viewer;
                    const scene = viewer.scene;
                    const sceneAABB = scene.getAABB(scene.visibleObjectIds);
                    viewer.cameraFlight.flyTo({
                        aabb: sceneAABB,
                        duration: 0.5
                    });
                    viewer.cameraControl.pivotPos = f.getAABB3Center(sceneAABB);
                }
            }
        ]);

        this.items = [
            showObjectItems,
            focusObjectItems,
            [
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("objectContextMenu.hide") || "Hide";
                    },
                    getEnabled: (context) => {
                        return context.entity.visible;
                    },
                    doAction: (context) => {
                        context.entity.visible = false;
                    }
                },
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("objectContextMenu.hideOthers") || "Hide Others";
                    },
                    doAction: (context) => {
                        const viewer = context.viewer;
                        const scene = viewer.scene;
                        const entity = context.entity;
                        const metaObject = viewer.metaScene.metaObjects[entity.id];
                        if (!metaObject) {
                            return;
                        }
                        scene.setObjectsVisible(scene.visibleObjectIds, false);
                        metaObject.withMetaObjectsInSubtree((metaObject) => {
                            const entity = scene.objects[metaObject.id];
                            if (entity) {
                                entity.visible = true;
                            }
                        });
                    }
                },
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("objectContextMenu.hideAll") || "Hide All";
                    },
                    getEnabled: (context) => {
                        return (context.viewer.scene.numVisibleObjects > 0);
                    },
                    doAction: (context) => {
                        context.viewer.scene.setObjectsVisible(context.viewer.scene.visibleObjectIds, false);
                    }
                },
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("objectContextMenu.showAll") || "Show All";
                    },
                    getEnabled: (context) => {
                        const scene = context.viewer.scene;
                        return ((scene.numVisibleObjects < scene.numObjects) || (context.viewer.scene.numXRayedObjects > 0));
                    },
                    doAction: (context) => {
                        const scene = context.viewer.scene;
                        scene.setObjectsVisible(scene.objectIds, true);
                        scene.setObjectsPickable(scene.xrayedObjectIds, true);
                        scene.setObjectsXRayed(scene.xrayedObjectIds, false);
                    }
                }
            ],
            [
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("objectContextMenu.xray") || "X-Ray";
                    },
                    getEnabled: (context) => {
                        return (!context.entity.xrayed);
                    },
                    doAction: (context) => {
                        const entity = context.entity;
                        entity.xrayed = true;
                        entity.pickable = context.bimViewer.getConfig("xrayPickable");
                    }
                },
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("objectContextMenu.xrayOthers") || "X-Ray Others";
                    },
                    doAction: (context) => {
                        const viewer = context.viewer;
                        const scene = viewer.scene;
                        const entity = context.entity;
                        const metaObject = viewer.metaScene.metaObjects[entity.id];
                        if (!metaObject) {
                            return;
                        }
                        scene.setObjectsVisible(scene.objectIds, true);
                        scene.setObjectsXRayed(scene.objectIds, true);
                        if (!context.bimViewer.getConfig("xrayPickable")) {
                            scene.setObjectsPickable(scene.objectIds, false);
                        }
                        metaObject.withMetaObjectsInSubtree((metaObject) => {
                            const entity = scene.objects[metaObject.id];
                            if (entity) {
                                entity.xrayed = false;
                                entity.pickable = true;
                            }
                        });
                    }
                },
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("objectContextMenu.xrayAll") || "X-Ray All";
                    },
                    getEnabled: (context) => {
                        const scene = context.viewer.scene;
                        return (scene.numXRayedObjects < scene.numObjects);
                    },
                    doAction: (context) => {
                        const scene = context.viewer.scene;
                        scene.setObjectsVisible(scene.objectIds, true);
                        if (!context.bimViewer.getConfig("xrayPickable")) {
                            scene.setObjectsPickable(scene.objectIds, false);
                        }
                        scene.setObjectsXRayed(scene.objectIds, true);
                    }
                },
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("objectContextMenu.xrayNone") || "X-Ray None";
                    },
                    getEnabled: (context) => {
                        return (context.viewer.scene.numXRayedObjects > 0);
                    },
                    doAction: (context) => {
                        const scene = context.viewer.scene;
                        const xrayedObjectIds = scene.xrayedObjectIds;
                        scene.setObjectsPickable(xrayedObjectIds, true);
                        scene.setObjectsXRayed(xrayedObjectIds, false);
                    }
                }
            ],
            [
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("objectContextMenu.select") || "Select";
                    },
                    getEnabled: (context) => {
                        return (!context.entity.selected);
                    },
                    doAction: (context) => {
                        context.entity.selected = true;

                    }
                },
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("objectContextMenu.undoSelect") || "Undo Select";
                    },
                    getEnabled: (context) => {
                        return context.entity.selected;
                    },
                    doAction: (context) => {
                        context.entity.selected = false;
                    }
                },
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("objectContextMenu.selectNone") || "Select None";
                    },
                    getEnabled: (context) => {
                        return (context.viewer.scene.numSelectedObjects > 0);
                    },
                    doAction: (context) => {
                        context.viewer.scene.setObjectsSelected(context.viewer.scene.selectedObjectIds, false);
                    }
                }
            ],
            [
                {
                    getTitle: (context) => {
                        return context.viewer.localeService.translate("objectContextMenu.clearSlices") || "Clear Slices";
                    },
                    getEnabled: (context) => {
                        return (context.bimViewer.getNumSections() > 0);
                    },
                    doAction: (context) => {
                        context.bimViewer.clearSections();
                    }
                }
            ]
        ];
    }
}

/**
 * @private
 */
class CanvasContextMenu extends a {
    constructor(cfg = {}) {
        super({
            context: cfg.context,
            items: [
                [
                    {
                        getTitle: (context) => {
                            return context.viewer.localeService.translate("canvasContextMenu.viewFitAll") || "View Fit All";
                        },
                        doAction: (context) => {
                            const viewer = context.viewer;
                            const scene = viewer.scene;
                            const sceneAABB = scene.getAABB(scene.visibleObjectIds);
                            viewer.cameraFlight.flyTo({
                                aabb: sceneAABB,
                                duration: 0.5
                            });
                            viewer.cameraControl.pivotPos = f.getAABB3Center(sceneAABB);
                        }
                    }
                ],
                [
                    {
                        getTitle: (context) => {
                            return context.viewer.localeService.translate("canvasContextMenu.hideAll") || "Hide All";
                        },
                        getEnabled: (context) => {
                            return (context.viewer.scene.numVisibleObjects > 0);
                        },
                        doAction: (context) => {
                            context.viewer.scene.setObjectsVisible(context.viewer.scene.visibleObjectIds, false);
                        }
                    },
                    {
                        getTitle: (context) => {
                            return context.viewer.localeService.translate("canvasContextMenu.showAll") || "Show All";
                        },
                        getEnabled: (context) => {
                            const scene = context.viewer.scene;
                            return ((scene.numVisibleObjects < scene.numObjects) || (context.viewer.scene.numXRayedObjects > 0));
                        },
                        doAction: (context) => {
                            const scene = context.viewer.scene;
                            scene.setObjectsVisible(scene.objectIds, true);
                            scene.setObjectsXRayed(scene.xrayedObjectIds, false);
                        }
                    }
                ],
                [
                    {
                        getTitle: (context) => {
                            return context.viewer.localeService.translate("canvasContextMenu.xRayAll") || "X-Ray All";
                        },
                        getEnabled: (context) => {
                            const scene = context.viewer.scene;
                            return (scene.numXRayedObjects < scene.numObjects);
                        },
                        doAction: (context) => {
                            const scene = context.viewer.scene;
                            scene.setObjectsVisible(scene.objectIds, true);
                            scene.setObjectsXRayed(scene.objectIds, true);
                            if (!context.bimViewer.getConfig("xrayPickable")) {
                                scene.setObjectsPickable(scene.objectIds, false);
                            }
                        }
                    },
                    {
                        getTitle: (context) => {
                            return context.viewer.localeService.translate("canvasContextMenu.xRayNone") || "X-Ray None";
                        },
                        getEnabled: (context) => {
                            return (context.viewer.scene.numXRayedObjects > 0);
                        },
                        doAction: (context) => {
                            const xrayedObjectIds = context.viewer.scene.xrayedObjectIds;
                            context.viewer.scene.setObjectsPickable(xrayedObjectIds, true);
                            context.viewer.scene.setObjectsXRayed(xrayedObjectIds, false);
                        }
                    }
                ],
                [
                    {
                        getTitle: (context) => {
                            return context.viewer.localeService.translate("canvasContextMenu.selectNone") || "Select None";
                        },
                        getEnabled: (context) => {
                            return (context.viewer.scene.numSelectedObjects > 0);
                        },
                        doAction: (context) => {
                            context.viewer.scene.setObjectsSelected(context.viewer.scene.selectedObjectIds, false);
                        }
                    }
                ],
                [
                    {
                        getTitle: (context) => {
                            return context.viewer.localeService.translate("canvasContextMenu.resetView") || "Reset View";
                        },
                        doAction: (context) => {
                            context.bimViewer.resetView();
                        }
                    }
                ],
                [
                    {
                        getTitle: (context) => {
                            return context.viewer.localeService.translate("canvasContextMenu.clearSlices") || "Clear Slices";
                        },
                        getEnabled: (context) => {
                            return (context.bimViewer.getNumSections() > 0);
                        },
                        doAction: (context) => {
                            context.bimViewer.clearSections();
                        }
                    }
                ]
            ]
        });
    }
}

/** @private */
class OrthoMode extends Controller {

    constructor(parent, cfg) {

        super(parent, cfg);

        if (!cfg.buttonElement) {
            throw "Missing config: buttonElement";
        }

        this._buttonElement = cfg.buttonElement;

        this.on("enabled", (enabled) => {
            if (!enabled) {
                this._buttonElement.classList.add("disabled");
            } else {
                this._buttonElement.classList.remove("disabled");
            }
        });

        this._buttonElement.addEventListener("click", (event) => {
            if (this.getEnabled()) {
                this.setActive(!this.getActive(), () => {
                });
            }
            event.preventDefault();
        });

        this.bimViewer.on("reset", () => {
            this.setActive(false);
        });

        this.viewer.camera.on("projection", () => {
            const isOrtho = (this.viewer.camera.projection === "ortho");
            this._active = isOrtho;
            if (this._active) {
                this._buttonElement.classList.add("active");
            } else {
                this._buttonElement.classList.remove("active");
            }
        });

        this._active = false;
        this._buttonElement.classList.remove("active");
    }

    setActive(active, done) {
        if (this._active === active) {
            if (done) {
                done();
            }
            return;
        }
        this._active = active;
        if (active) {
            this._buttonElement.classList.add("active");
            if (done) {
                this._enterOrthoMode(() => {
                    this.fire("active", this._active);
                    done();
                });
            } else {
                this._enterOrthoMode();
                this.fire("active", this._active);
            }
        } else {
            this._buttonElement.classList.remove("active");
            if (done) {
                this._exitOrthoMode(() => {
                    this.fire("active", this._active);
                    done();
                });
            } else {
                this._exitOrthoMode();
                this.fire("active", this._active);
            }
        }
    }

    _enterOrthoMode(done) {
        if (done) {
            this.viewer.cameraFlight.flyTo({projection: "ortho", duration: 0.5}, done);
        } else {
            this.viewer.cameraFlight.jumpTo({projection: "ortho"});
        }
    }

    _exitOrthoMode(done) {
        if (done) {
            this.viewer.cameraFlight.flyTo({projection: "perspective", duration: 0.5}, done);
        } else {
            this.viewer.cameraFlight.jumpTo({projection: "perspective"});
        }
    }
}

/** @private */
class PropertiesInspector extends Controller {

    constructor(parent, cfg = {}) {

        super(parent);

        if (!cfg.propertiesTabElement) {
            throw "Missing config: propertiesTabElement";
        }

        if (!cfg.propertiesElement) {
            throw "Missing config: propertiesElement";
        }

        this._metaObject = null;

        this._propertiesTabElement = cfg.propertiesTabElement;
        this._propertiesElement = cfg.propertiesElement;
        this._propertiesTabButtonElement = this._propertiesTabElement.querySelector(".xeokit-tab-btn");

        if (!this._propertiesTabButtonElement) {
            throw "Missing DOM element: ,xeokit-tab-btn";
        }

        this._onModelUnloaded = this.viewer.scene.on("modelUnloaded", (modelId) => {
            if (this._metaObject && this._metaObject.metaModel.id === modelId) {
                this.clear();
            }
        });

        this.bimViewer.on("reset", () => {
            this.clear();
        });

        document.addEventListener('click', this._clickListener = (e) => {
            if (!e.target.matches('.xeokit-accordion .xeokit-accordion-button')) {
                return;
            } else {
                if (!e.target.parentElement.classList.contains('active')) {
                    e.target.parentElement.classList.add('active');
                } else {
                    e.target.parentElement.classList.remove('active');
                }
            }
        });

        this.clear();
    }

    showObjectPropertySets(objectId) {
        const metaObject = this.viewer.metaScene.metaObjects[objectId];
        if (!metaObject) {
            return;
        }
        const propertySets = metaObject.propertySets;
        if (propertySets && propertySets.length > 0) {
            this._setPropertySets(metaObject, propertySets);
        } else {
            this._setPropertySets(metaObject);
        }
        this._metaObject = metaObject;
    }

    clear() {
        const html = [];
        html.push(`<div class="element-attributes">`);
        html.push(`<p class="subsubtitle no-object-selected-warning">No object inspected. Right-click or long-tab an object and select \'Inspect Properties\' to view its properties here.</p>`);
        html.push(`</div>`);
        const htmlStr = html.join("");
       this._propertiesElement.innerHTML = htmlStr;
    }

    _setPropertySets(metaObject, propertySets) {
        const html = [];
        html.push(`<div class="element-attributes">`);
        if (!metaObject) {
            html.push(`<p class="subsubtitle">No object selected</p>`);
        } else {
            html.push('<table class="xeokit-table">');
            html.push(`<tr><td class="td1">Name:</td><td class="td2">${metaObject.name}</td></tr>`);
            if (metaObject.type) {
                html.push(`<tr><td class="td1">Class:</td><td class="td2">${metaObject.type}</td></tr>`);
            }
            html.push(`<tr><td class="td1">UUID:</td><td class="td2">${metaObject.originalSystemId}</td></tr>`);
            html.push(`<tr><td class="td1">Viewer ID:</td><td class="td2">${metaObject.id}</td></tr>`);
            html.push('</table>');
            if (!propertySets || propertySets.length === 0) {
                html.push(`<p class="subtitle xeokit-no-prop-set-warning">No properties sets found for this object.</p>`);
                html.push(`</div>`);
            } else {
                html.push(`</div>`);
                html.push(`<div class="xeokit-accordion">`);
                for (let i = 0, len = propertySets.length; i < len; i++) {
                    const propertySet = propertySets[i];
                    const properties = propertySet.properties || [];
                    if (properties.length > 0) {
                        html.push(`<div class="xeokit-accordion-container">
                                        <p class="xeokit-accordion-button"><span></span>${propertySet.name}</p>                                       
                                        <div class="xeokit-accordion-panel">                                           
                                            <table class="xeokit-table"><tbody>`);
                        for (let i = 0, len = properties.length; i < len; i++) {
                            const property = properties[i];
                            html.push(`<tr><td class="td1">${property.name || property.label}:</td><td class="td2">${property.value}</td></tr>`);
                        }
                        html.push(`</tbody></table>
                        </div>
                        </div>`);
                    }
                }
                html.push(`</div>`);
            }
        }
        this._propertiesElement.innerHTML = html.join("");
    }

    setEnabled(enabled) {
        if (!enabled) {
            this._propertiesTabButtonElement.classList.add("disabled");
        } else {
            this._propertiesTabButtonElement.classList.remove("disabled");
        }
    }

    destroy() {
        super.destroy();
        this.viewer.scene.off(this._onModelLoaded);
        this.viewer.scene.off(this._onModelUnloaded);
        document.removeEventListener('click', this._clickListener);
    }
}

const hideEdgesMinDrawCount = 5; // FastNavPlugin enables dynamic edges when xeokit's per-frame draw count drops below this
const scaleCanvasResolutionMinDrawCount = 1000; // FastNavPlugin switches to low-res canvas when xeokit's per-frame draw count rises above this

function createExplorerTemplate(cfg) {
    const explorerTemplate = `<div class="xeokit-tabs"> 
    <div class="xeokit-tab xeokit-modelsTab">
        <a class="xeokit-i18n xeokit-tab-btn" href="#" data-xeokit-i18n="modelsExplorer.title">Models</a>
        <div class="xeokit-tab-content">
            <div class="xeokit-btn-group">
                <button type="button" class="xeokit-i18n xeokit-loadAllModels xeokit-btn disabled" data-xeokit-i18n="modelsExplorer.loadAll" data-xeokit-i18ntip="modelsExplorer.loadAllTip" data-tippy-content="Load all models">Load all</button>
                <button type="button" class="xeokit-i18n xeokit-unloadAllModels xeokit-btn disabled" data-xeokit-i18n="modelsExplorer.unloadAll"  data-xeokit-i18ntip="modelsExplorer.unloadAllTip" data-tippy-content="Unload all models">Unload all</button>` +
        (cfg.enableEditModels ? `<button type="button" class="xeokit-i18n xeokit-addModel xeokit-btn disabled" data-xeokit-i18n="modelsExplorer.add"  data-xeokit-i18ntip="modelsExplorer.addTip" data-tippy-content="Add model">Add</button>` : ``) + `</div>
            <div class="xeokit-models" ></div>
        </div>
    </div>
    <div class="xeokit-tab xeokit-objectsTab">
        <a class="xeokit-i18n xeokit-tab-btn disabled" href="#" data-xeokit-i18n="objectsExplorer.title">Objects</a>
        <div class="xeokit-tab-content">
         <div class="xeokit-btn-group">
            <button type="button" class="xeokit-i18n xeokit-showAllObjects xeokit-btn disabled" data-xeokit-i18n="objectsExplorer.showAll" data-xeokit-i18ntip="objectsExplorer.showAllTip" data-tippy-content="Show all objects">Show all</button>
            <button type="button" class="xeokit-i18n xeokit-hideAllObjects xeokit-btn disabled" data-xeokit-i18n="objectsExplorer.hideAll" data-xeokit-i18ntip="objectsExplorer.hideAllTip" data-tippy-content="Hide all objects">Hide all</button>
        </div>
        <div class="xeokit-objects xeokit-tree-panel" ></div>
        </div>
    </div>
    <div class="xeokit-i18n xeokit-tab xeokit-classesTab">
        <a class="xeokit-i18n xeokit-tab-btn disabled" href="#" data-xeokit-i18n="classesExplorer.title">Classes</a>
        <div class="xeokit-tab-content">
            <div class="xeokit-btn-group">
                <button type="button" class="xeokit-i18n xeokit-showAllClasses xeokit-btn disabled" data-xeokit-i18n="classesExplorer.showAll"  data-xeokit-i18ntip="classesExplorer.hideAllTip" data-tippy-content="Show all classes">Show all</button>
                <button type="button" class="xeokit-i18n xeokit-hideAllClasses xeokit-btn disabled" data-xeokit-i18n="classesExplorer.hideAll" data-xeokit-i18ntip="classesExplorer.hideAllTip" data-tippy-content="Hide all classes">Hide all</button>
            </div>
            <div class="xeokit-classes xeokit-tree-panel" ></div>
        </div>
    </div>
     <div class="xeokit-tab xeokit-storeysTab">
        <a class="xeokit-i18n xeokit-tab-btn disabled" href="#" data-xeokit-i18n="storeysExplorer.title">Storeys</a>
        <div class="xeokit-tab-content">
         <div class="xeokit-btn-group">
                <button type="button" class="xeokit-i18n xeokit-showAllStoreys xeokit-btn disabled" data-xeokit-i18n="storeysExplorer.showAll" data-xeokit-i18ntip="storeysExplorer.showAllTip" data-tippy-content="Show all storeys">Show all</button>
                <button type="button" class="xeokit-i18n xeokit-hideAllStoreys xeokit-btn disabled" data-xeokit-i18n="storeysExplorer.hideAll" data-xeokit-i18ntip="storeysExplorer.hideAllTip" data-tippy-content="Hide all storeys">Hide all</button>
            </div>
             <div class="xeokit-storeys xeokit-tree-panel"></div>
        </div>
    </div>
</div>`;
    return explorerTemplate;
}

function createToolbarTemplate() {
    const toolbarTemplate = `<div class="xeokit-toolbar">
    <!-- Reset button -->
    <div class="xeokit-btn-group">
        <button type="button" class="xeokit-i18n xeokit-reset xeokit-btn fa fa-home fa-2x disabled" data-xeokit-i18ntip="toolbar.resetViewTip" data-tippy-content="Reset view"></button>
    </div>
    <div class="xeokit-btn-group" role="group">
        <!-- 3D Mode button -->
        <button type="button" class="xeokit-i18n xeokit-threeD xeokit-btn fa fa-cube fa-2x disabled" data-xeokit-i18ntip="toolbar.toggle2d3dTip" data-tippy-content="Toggle 2D/3D"></button>
        <!-- Perspective/Ortho Mode button -->
        <button type="button" class="xeokit-i18n xeokit-ortho xeokit-btn fa fa-th fa-2x  disabled" data-xeokit-i18ntip="toolbar.togglePerspectiveTip" data-tippy-content="Toggle Perspective/Ortho"></button>
        <!-- Fit button -->
        <button type="button" class="xeokit-i18n xeokit-fit xeokit-btn fa fa-crop fa-2x disabled" data-xeokit-i18ntip="toolbar.viewFitTip" data-tippy-content="View fit"></button>
        <!-- First Person mode button -->
        <button type="button" class="xeokit-i18n xeokit-firstPerson xeokit-btn fa fa-male fa-2x disabled" data-xeokit-i18ntip="toolbar.firstPersonTip" data-tippy-content="Toggle first-person mode"></button>
          <!-- Show/hide IFCSpaces -->
        <button type="button" class="xeokit-i18n xeokit-showSpaces xeokit-btn fab fa-codepen fa-2x disabled" data-xeokit-i18ntip="toolbar.showSpacesTip" data-tippy-content="Show IFCSpaces"></button>   
    </div>
    <!-- Tools button group -->
    <div class="xeokit-btn-group" role="group">
        <!-- Hide tool button -->
        <button type="button" class="xeokit-i18n xeokit-hide xeokit-btn fa fa-eraser fa-2x disabled" data-xeokit-i18ntip="toolbar.hideObjectsTip" data-tippy-content="Hide objects"></button>
        <!-- Select tool button -->
        <button type="button" class="xeokit-i18n xeokit-select xeokit-btn fa fa-mouse-pointer fa-2x disabled" data-xeokit-i18ntip="toolbar.selectObjectsTip" data-tippy-content="Select objects"></button>    
        <!-- section tool button -->
        <button type="button" class="xeokit-i18n xeokit-section xeokit-btn fa fa-cut fa-2x disabled" data-xeokit-i18ntip="toolbar.sliceObjectsTip" data-tippy-content="Slice objects">
            <div class="xeokit-i18n xeokit-section-menu-button disabled" data-xeokit-i18ntip="toolbar.slicesMenuTip"  data-tippy-content="Slices menu">
                <span class="xeokit-arrow-down xeokit-section-menu-button-arrow"></span>
            </div>
            <div class="xeokit-i18n xeokit-section-counter" data-xeokit-i18ntip="toolbar.numSlicesTip" data-tippy-content="Number of existing slices"></div>
        </button>
    </div>
</div>`;
    return toolbarTemplate;
}

function createInspectorTemplate() {
    const inspectorTemplate = `<div class="xeokit-tabs">  
    <div class="xeokit-tab xeokit-propertiesTab">
        <a class="xeokit-i18n xeokit-tab-btn disabled" href="#" data-xeokit-i18n="propertiesInspector.title">Properties</a>
        <div class="xeokit-tab-content">        
        <div class="xeokit-properties"></div>
        </div>
    </div>
</div>`;
    return inspectorTemplate;
}

function initTabs(containerElement) {

    const tabsClass = 'xeokit-tabs';
    const tabClass = 'xeokit-tab';
    const tabButtonClass = 'xeokit-tab-btn';
    const activeClass = 'active';

    // Activates the chosen tab and deactivates the rest
    function activateTab(chosenTabElement) {
        let tabList = chosenTabElement.parentNode.querySelectorAll('.' + tabClass);
        for (let i = 0; i < tabList.length; i++) {
            let tabElement = tabList[i];
            if (tabElement.isEqualNode(chosenTabElement)) {
                tabElement.classList.add(activeClass);
            } else {
                tabElement.classList.remove(activeClass);
            }
        }
    }

    // Initialize each tabbed container
    let tabbedContainers = containerElement.querySelectorAll('.' + tabsClass);
    for (let i = 0; i < tabbedContainers.length; i++) {
        let tabbedContainer = tabbedContainers[i];
        let tabList = tabbedContainer.querySelectorAll('.' + tabClass);
        activateTab(tabList[0]);
        for (let i = 0; i < tabList.length; i++) {
            let tabElement = tabList[i];
            let tabButton = tabElement.querySelector('.' + tabButtonClass);
            tabButton.addEventListener('click', function (event) {
                event.preventDefault();
                if (this.classList.contains("disabled")) {
                    return;
                }
                activateTab(event.target.parentNode);
            });
        }
    }
}


/**
 * @desc A BIM viewer based on the [xeokit SDK](http://xeokit.io).
 *
 *
 */
class BIMViewer extends Controller {

    /**
     * Constructs a BIMViewer.
     * @param {Server} server Data access strategy.
     * @param {*} cfg Configuration.
     * @param {Boolean} [cfg.enableEditModels=false] Set ````true```` to show "Add", "Edit" and "Delete" options in the Models tab's context menu.
     * @param {Boolean} [cfg.keyboardEventsElement] Optional reference to HTML element on which key events should be handled. Defaults to the HTML Document.
     */
    constructor(server, cfg = {}) {

        if (!cfg.canvasElement) {
            throw "Config expected: canvasElement";
        }

        if (!cfg.explorerElement) {
            throw "Config expected: explorerElement";
        }

        if (!cfg.toolbarElement) {
            throw "Config expected: toolbarElement";
        }

        if (!cfg.navCubeCanvasElement) {
            throw "Config expected: navCubeCanvasElement";
        }

        const canvasElement = cfg.canvasElement;
        const explorerElement = cfg.explorerElement;
        const inspectorElement = cfg.inspectorElement;
        const toolbarElement = cfg.toolbarElement;
        const navCubeCanvasElement = cfg.navCubeCanvasElement;
        const busyModelBackdropElement = cfg.busyModelBackdropElement;

        explorerElement.oncontextmenu = (e) => {
            e.preventDefault();
        };

        toolbarElement.oncontextmenu = (e) => {
            e.preventDefault();
        };

        navCubeCanvasElement.oncontextmenu = (e) => {
            e.preventDefault();
        };

        const viewer = new fR({
            localeService: cfg.localeService,
            canvasElement: canvasElement,
            keyboardEventsElement: cfg.keyboardEventsElement,
            transparent: false,
            backgroundColor: [0.96078431372549, 0.992156862745098, 1],
            backgroundColorFromAmbientLight: false,
            saoEnabled: true,
            pbrEnabled: true
        });

        super(null, cfg, server, viewer);

        this._configs = {};

        this._enableAddModels = !!cfg.enableEditModels;
        this._enablePropertiesInspector = !!cfg.inspectorElement;

        /**
         * The xeokit [Viewer](https://xeokit.github.io/xeokit-sdk/docs/class/src/viewer/Viewer.js~Viewer.html) at the core of this BIMViewer.
         *
         * @type {Viewer}
         */
        this.viewer = viewer;

        this._customizeViewer();
        this._initCanvasContextMenus();

        explorerElement.innerHTML = createExplorerTemplate(cfg);
        toolbarElement.innerHTML = createToolbarTemplate();
        if (this._enablePropertiesInspector) {
            inspectorElement.innerHTML = createInspectorTemplate();
        }

        this._explorerElement = explorerElement;
        this._inspectorElement = inspectorElement;

        initTabs(explorerElement);
        if (this._enablePropertiesInspector) {
            initTabs(inspectorElement);
        }

        this._modelsExplorer = new ModelsExplorer(this, {
            modelsTabElement: explorerElement.querySelector(".xeokit-modelsTab"),
            loadModelsButtonElement: explorerElement.querySelector(".xeokit-loadAllModels"), // Can be undefined
            unloadModelsButtonElement: explorerElement.querySelector(".xeokit-unloadAllModels"),
            addModelButtonElement: explorerElement.querySelector(".xeokit-addModel"), // Can be undefined
            modelsElement: explorerElement.querySelector(".xeokit-models"),
            enableEditModels: this._enableAddModels
        });

        this._objectsExplorer = new ObjectsExplorer(this, {
            objectsTabElement: explorerElement.querySelector(".xeokit-objectsTab"),
            showAllObjectsButtonElement: explorerElement.querySelector(".xeokit-showAllObjects"),
            hideAllObjectsButtonElement: explorerElement.querySelector(".xeokit-hideAllObjects"),
            objectsElement: explorerElement.querySelector(".xeokit-objects")
        });

        this._classesExplorer = new ClassesExplorer(this, {
            classesTabElement: explorerElement.querySelector(".xeokit-classesTab"),
            showAllClassesButtonElement: explorerElement.querySelector(".xeokit-showAllClasses"),
            hideAllClassesButtonElement: explorerElement.querySelector(".xeokit-hideAllClasses"),
            classesElement: explorerElement.querySelector(".xeokit-classes")
        });

        this._storeysExplorer = new StoreysExplorer(this, {
            storeysTabElement: explorerElement.querySelector(".xeokit-storeysTab"),
            showAllStoreysButtonElement: explorerElement.querySelector(".xeokit-showAllStoreys"),
            hideAllStoreysButtonElement: explorerElement.querySelector(".xeokit-hideAllStoreys"),
            storeysElement: explorerElement.querySelector(".xeokit-storeys")
        });

        if (this._enablePropertiesInspector) {
            this._propertiesInspector = new PropertiesInspector(this, {
                propertiesTabElement: inspectorElement.querySelector(".xeokit-propertiesTab"),
                propertiesElement: inspectorElement.querySelector(".xeokit-properties")
            });
        }

        this._resetAction = new ResetAction(this, {
            buttonElement: toolbarElement.querySelector(".xeokit-reset"),
            active: false
        });

        this._fitAction = new FitAction(this, {
            buttonElement: toolbarElement.querySelector(".xeokit-fit"),
            active: false
        });

        // Allows Three-D and First Person toggle buttons to cooperatively switch
        // CameraControl#navMode between "orbit", "firstPerson" and "planView" modes

        const cameraControlNavModeMediator = new (function (bimViewer) {

            let threeDActive = false;

            this.setThreeDModeActive = (active) => {
                if (active) {
                    bimViewer._firstPersonMode.setActive(false);
                    bimViewer.viewer.cameraControl.navMode = "orbit";
                } else {
                    bimViewer._firstPersonMode.setActive(false);
                    bimViewer.viewer.cameraControl.navMode = "planView";
                }
                threeDActive = active;
            };

            this.setFirstPersonModeActive = (active) => {
                bimViewer.viewer.cameraControl.navMode = active ? "firstPerson" : (threeDActive ? "orbit" : "planView");
            };
        })(this);

        this._threeDMode = new ThreeDMode(this, {
            buttonElement: toolbarElement.querySelector(".xeokit-threeD"),
            cameraControlNavModeMediator: cameraControlNavModeMediator,
            active: false
        });

        this._orthoMode = new OrthoMode(this, {
            buttonElement: toolbarElement.querySelector(".xeokit-ortho"),
            active: false
        });

        this._firstPersonMode = new FirstPersonMode(this, {
            buttonElement: toolbarElement.querySelector(".xeokit-firstPerson"),
            cameraControlNavModeMediator: cameraControlNavModeMediator,
            active: false
        });

        this._hideTool = new HideTool(this, {
            buttonElement: toolbarElement.querySelector(".xeokit-hide"),
            active: false
        });

        this._selectionTool = new SelectionTool(this, {
            buttonElement: toolbarElement.querySelector(".xeokit-select"),
            active: false
        });

        this._showSpacesMode = new ShowSpacesMode(this, {
            buttonElement: toolbarElement.querySelector(".xeokit-showSpaces"),
            active: false
        });

        this._queryTool = new QueryTool(this, {
            active: false
        });

        this._sectionTool = new SectionTool(this, {
            buttonElement: toolbarElement.querySelector(".xeokit-section"),
            counterElement: toolbarElement.querySelector(".xeokit-section-counter"),
            menuButtonElement: toolbarElement.querySelector(".xeokit-section-menu-button"),
            menuButtonArrowElement: toolbarElement.querySelector(".xeokit-section-menu-button-arrow"),
            active: false
        });

        this._navCubeMode = new NavCubeMode(this, {
            navCubeCanvasElement: navCubeCanvasElement,
            active: true
        });

        this._busyModal = new BusyModal(this, {
            busyModalBackdropElement: busyModelBackdropElement
        });

        this._threeDMode.setActive(true);
        this._firstPersonMode.setActive(false);
        this._navCubeMode.setActive(true);

        this._modelsExplorer.on("modelLoaded", (modelId) => {
            if (this._modelsExplorer.getNumModelsLoaded() > 0) {
                this.setControlsEnabled(true);
            }
            this.fire("modelLoaded", modelId);
        });

        this._modelsExplorer.on("modelUnloaded", (modelId) => {
            if (this._modelsExplorer.getNumModelsLoaded() === 0) {
                this.setControlsEnabled(false);
                this.openTab("models");
            }
            this.fire("modelUnloaded", modelId);
        });

        this._resetAction.on("reset", () => {
            this.fire("reset", true);
        });

        this._mutexActivation([this._hideTool, this._selectionTool, this._sectionTool]);

        explorerElement.querySelector(".xeokit-showAllObjects").addEventListener("click", (event) => {
            this.setAllObjectsVisible(true);
            this.setAllObjectsXRayed(false);
            event.preventDefault();
        });

        explorerElement.querySelector(".xeokit-hideAllObjects").addEventListener("click", (event) => {
            this.setAllObjectsVisible(false);
            event.preventDefault();
        });

        explorerElement.querySelector(".xeokit-showAllClasses").addEventListener("click", (event) => {
            this.setAllObjectsVisible(true);
            this.setAllObjectsXRayed(false);
            event.preventDefault();
        });

        explorerElement.querySelector(".xeokit-hideAllClasses").addEventListener("click", (event) => {
            this.setAllObjectsVisible(false);
            event.preventDefault();
        });

        explorerElement.querySelector(".xeokit-showAllStoreys").addEventListener("click", (event) => {
            this.setAllObjectsVisible(true);
            this.setAllObjectsXRayed(false);
            event.preventDefault();
        });

        explorerElement.querySelector(".xeokit-hideAllStoreys").addEventListener("click", (event) => {
            this.setAllObjectsVisible(false);
            event.preventDefault();
        });

        explorerElement.querySelector(".xeokit-loadAllModels").addEventListener("click", (event) => {
            this.setControlsEnabled(false); // For quick UI feedback
            this.loadAllModels();
            event.preventDefault();
        });

        explorerElement.querySelector(".xeokit-unloadAllModels").addEventListener("click", (event) => {
            this.setControlsEnabled(false); // For quick UI feedback
            this._modelsExplorer.unloadAllModels();
            event.preventDefault();
        });

        if (this._enableAddModels) {
            explorerElement.querySelector(".xeokit-addModel").addEventListener("click", (event) => {
                this.fire("addModel", {});
                event.preventDefault();
            });
        }

        this._bcfViewpointsPlugin = new sr(this.viewer, {});

        this._fastNavPlugin = new pr(viewer, {
            hideEdges: true,
            hideSAO: true,
            hidePBR: false,
            hideTransparentObjects: false,
            scaleCanvasResolution: false,
            scaleCanvasResolutionFactor: 0.6
        });

        this.viewer.scene.on("rendered", () => {
            const fastNavPlugin = this._fastNavPlugin;
            fastNavPlugin.hideEdges = (hideEdgesMinDrawCount < (g.frame.drawElements + g.frame.drawArrays));
            fastNavPlugin.scaleCanvasResolution = (scaleCanvasResolutionMinDrawCount < (g.frame.drawElements + g.frame.drawArrays));
        });

        this._initConfigs();
        this.setControlsEnabled(false);
    }

    /**
     * Returns the LocaleService that was configured on this Viewer.
     *
     * @return {LocaleService} The LocaleService.
     */
    get localeService() {
        return this.viewer.localeService;
    }

    _customizeViewer() {

        const scene = this.viewer.scene;

        // Emphasis effects

        scene.xrayMaterial.fill = false;
        scene.xrayMaterial.fillAlpha = 0.3;
        scene.xrayMaterial.fillColor = [0, 0, 0];
        scene.xrayMaterial.edges = true;
        scene.xrayMaterial.edgeAlpha = 0.1;
        scene.xrayMaterial.edgeColor = [0, 0, 0];

        scene.highlightMaterial.edges = true;
        scene.highlightMaterial.edgeColor = [1, 1, 0];
        scene.highlightMaterial.edgeAlpha = 0.9;
        scene.highlightMaterial.fill = true;
        scene.highlightMaterial.fillAlpha = 0.1;
        scene.highlightMaterial.fillColor = [1, 0, 0];

        //------------------------------------------------------------------------------------------------------------------
        // Configure points material
        //------------------------------------------------------------------------------------------------------------------

        scene.pointsMaterial.pointSize = 1;
        scene.pointsMaterial.roundPoints = true;
        scene.pointsMaterial.perspectivePoints = true;
        scene.pointsMaterial.minPerspectivePointSize = 2;
        scene.pointsMaterial.maxPerspectivePointSize = 4;

        // Camera control

        this.viewer.cameraControl.panRightClick = true;
        this.viewer.cameraControl.followPointer = true;
        this.viewer.cameraControl.doublePickFlyTo = false;
        this.viewer.cameraControl.smartPivot = true;

        // Dolly tweaks for best precision when aligning camera for BCF snapshots

        this.viewer.cameraControl.keyboardDollyRate = 100.0;
        this.viewer.cameraControl.mouseWheelDollyRate = 100.0;
        this.viewer.cameraControl.dollyInertia = 0;
        this.viewer.cameraControl.dollyMinSpeed = 0.04;
        this.viewer.cameraControl.dollyProximityThreshold = 30.0;

        const cameraPivotElement = document.createRange().createContextualFragment("<div class='xeokit-camera-pivot-marker'></div>").firstChild;
        document.body.appendChild(cameraPivotElement);
        this.viewer.cameraControl.pivotElement = cameraPivotElement;

        scene.camera.perspective.near = 0.01;
        scene.camera.perspective.far = 3000.0;
        scene.camera.ortho.near = 0.01;
        scene.camera.ortho.far = 2000.0; //

        // Scalable Ambient Obscurance (SAO) defaults
        // Since SAO is non-interactive, set to higher-quality

        const sao = scene.sao;
        sao.enabled = true;
        sao.numSamples = 50;
        sao.kernelRadius = 200;
    }

    _initCanvasContextMenus() {

        this._canvasContextMenu = new CanvasContextMenu(this);
        this._objectContextMenu = new ObjectContextMenu(this);

        this.viewer.cameraControl.on("rightClick", (e) => {

            const event = e.event;

            const hit = this.viewer.scene.pick({
                canvasPos: e.canvasPos
            });

            if (hit && hit.entity.isObject) {
                this._canvasContextMenu.hide();
                this._objectContextMenu.context = {
                    viewer: this.viewer,
                    bimViewer: this,
                    showObjectInExplorers: (objectId) => {
                        const openTabId = this.getOpenTab();
                        if (openTabId !== "objects" && openTabId !== "classes" && openTabId !== "storeys") {
                            // Scroll won't work if tab not open
                            this.openTab("objects");
                        }
                        this.showObjectInExplorers(objectId);
                    },
                    entity: hit.entity
                };
                this._objectContextMenu.show(e.pagePos[0], e.pagePos[1]);
            } else {
                this._objectContextMenu.hide();
                this._canvasContextMenu.context = {
                    viewer: this.viewer,
                    bimViewer: this
                };
                this._canvasContextMenu.show(e.pagePos[0], e.pagePos[1]);
            }
        });
    }

    _initConfigs() {
        this.setConfigs({
            "cameraNear": "0.05",
            "cameraFar": "3000.0",
            "smartPivot": "true",
            "saoEnabled": "true",
            "pbrEnabled": "false",
            "saoBias": "0.5",
            "saoIntensity": "0.15",
            "saoNumSamples": "40",
            "saoKernelRadius": "100",
            "edgesEnabled": true,
            "xrayContext": true,
            "xrayPickable": false,
            "selectedGlowThrough": true,
            "highlightGlowThrough": true,
            "backgroundColor": [1.0, 1.0, 1.0],
            "objectColorSource": "model",
            "externalMetadata": false
        });
    }

    /**
     * Sets a batch of viewer configurations.
     *
     * Note that this method is not to be confused with {@link BIMViewer#setViewerState}, which batch-updates various states of the viewer's UI and 3D view.
     *
     * See [Viewer Configurations](https://xeokit.github.io/xeokit-bim-viewer/docs/#viewer-configurations) for the list of available configurations.
     *
     * @param {*} viewerConfigs Map of key-value configuration pairs.
     */
    setConfigs(viewerConfigs) {
        for (let name in viewerConfigs) {
            if (viewerConfigs.hasOwnProperty(name)) {
                const value = viewerConfigs[name];
                this.setConfig(name, value);
            }
        }
    }

    /**
     * Sets a viewer configuration.
     *
     * See [Viewer Configurations](https://xeokit.github.io/xeokit-bim-viewer/docs/#viewer-configurations) for the list of available configurations.
     *
     * @param {String} name Configuration name.
     * @param {*} value Configuration value.
     */
    setConfig(name, value) {

        function parseBool(value) {
            return ((value === true) || (value === "true"));
        }

        try {
            switch (name) {

                case "backgroundColor":
                    const rgbColor = value;
                    this.setBackgroundColor(rgbColor);
                    this._configs[name] = rgbColor;
                    break;

                case "cameraNear":
                    const near = parseFloat(value);
                    this.viewer.scene.camera.perspective.near = near;
                    this.viewer.scene.camera.ortho.near = near;
                    this._configs[name] = near;
                    break;

                case "cameraFar":
                    const far = parseFloat(value);
                    this.viewer.scene.camera.perspective.far = far;
                    // this.viewer.scene.camera.ortho.far = far;
                    this._configs[name] = far;
                    break;

                case "smartPivot":
                    this.viewer.cameraControl.smartPivot = this._configs[name] = parseBool(value);
                    break;

                case "saoEnabled":
                    this._fastNavPlugin.saoEnabled = this._configs[name] = parseBool(value);
                    break;

                case "saoBias":
                    this.viewer.scene.sao.bias = parseFloat(value);
                    break;

                case "saoIntensity":
                    this.viewer.scene.sao.intensity = parseFloat(value);
                    break;

                case "saoKernelRadius":
                    this.viewer.scene.sao.kernelRadius = this._configs[name] = parseFloat(value);
                    break;

                case "saoNumSamples":
                    this.viewer.scene.sao.numSamples = this._configs[name] = parseFloat(value);
                    break;

                case "saoBlur":
                    this.viewer.scene.sao.blur = this._configs[name] = parseBool(value);
                    break;

                case "edgesEnabled":
                    this._fastNavPlugin.edgesEnabled = this._configs[name] = parseBool(value);
                    break;

                case "pbrEnabled":
                    this._fastNavPlugin.pbrEnabled = this._configs[name] = parseBool(value);
                    break;

                case "viewFitFOV":
                    this.viewer.cameraFlight.fitFOV = this._configs[name] = parseFloat(value);
                    break;

                case "viewFitDuration":
                    this.viewer.cameraFlight.duration = this._configs[name] = parseFloat(value);
                    break;

                case "perspectiveFOV":
                    this.viewer.camera.perspective.fov = this._configs[name] = parseFloat(value);
                    break;

                case "excludeUnclassifiedObjects":
                    this._configs[name] = parseBool(value);
                    break;

                case "objectColorSource":
                    this.setObjectColorSource(value);
                    this._configs[name] = value;
                    break;

                case "xrayContext":
                    this._configs[name] = value;
                    break;

                case "xrayPickable":
                    this._configs[name] = parseBool(value);
                    break;

                case "selectedGlowThrough":
                    const selectedGlowThrough = this._configs[name] = parseBool(value);
                    const selectedMaterial = this.viewer.scene.selectedMaterial;
                    selectedMaterial.glowThrough = selectedGlowThrough;
                    selectedMaterial.fillAlpha = selectedGlowThrough ? 0.5 : 1.0;
                    selectedMaterial.edgeAlpha = selectedGlowThrough ? 0.5 : 1.0;
                    break;

                case "highlightGlowThrough":
                    const highlightGlowThrough = this._configs[name] = parseBool(value);
                    const highlightMaterial = this.viewer.scene.highlightMaterial;
                    highlightMaterial.glowThrough = highlightGlowThrough;
                    highlightMaterial.fillAlpha = highlightGlowThrough ? 0.5 : 1.0;
                    highlightMaterial.edgeAlpha = highlightGlowThrough ? 0.5 : 1.0;
                    break;

                case "externalMetadata":
                    this._configs[name] = parseBool(value);
                    break;

                case "showSpaces":
                    this._configs[name] = parseBool(value);
                    this._showSpacesMode.setActive(value);
                    break;

                default:
                    this.error("setConfig() - unsupported configuration: '" + name + "'");
            }

        } catch (e) {
            this.error("setConfig() - failed to configure '" + name + "': " + e);
        }
    }

    /**
     * Gets the value of a viewer configuration.
     *
     * These are set with {@link BIMViewer#setConfig} and {@link BIMViewer#setConfigs}.
     *
     * @param {String} name Configuration name.
     * @ereturns {*} Configuration value.
     */
    getConfig(name) {
        return this._configs[name];
    }

    //------------------------------------------------------------------------------------------------------------------
    // Content querying methods
    //------------------------------------------------------------------------------------------------------------------

    /**
     * Gets information on all available projects.
     * Gets information on all available projects.
     *
     * See [Getting Info on Available Projects](https://xeokit.github.io/xeokit-bim-viewer/docs/#getting-info-on-available-projects) for usage.
     *
     * @param {Function} done Callback invoked on success, into which the projects information JSON is passed.
     * @param {Function} error Callback invoked on failure, into which the error message string is passed.
     */
    getProjectsInfo(done, error) {
        if (!done) {
            this.error("getProjectsInfo() - Argument expected: 'done'");
            return;
        }
        this.server.getProjects(done, (errorMsg) => {
            this.error("getProjectsInfo() - " + errorMsg);
            if (error) {
                error(errorMsg);
            }
        });
    }

    /**
     * Gets information on the given project.
     *
     * See [Getting Info on a Project](https://xeokit.github.io/xeokit-bim-viewer/docs/#getting-info-on-a-project) for usage.
     *
     * @param {String} projectId ID of the project to get information on. Must be the ID of one of the projects in the information obtained by {@link BIMViewer#getProjects}.
     * @param {Function} done Callback invoked on success, into which the project information JSON is passed.
     * @param {Function} error Callback invoked on failure, into which the error message string is passed.
     */
    getProjectInfo(projectId, done, error) {
        if (!projectId) {
            this.error("getProjectInfo() - Argument expected: projectId");
            return;
        }
        if (!done) {
            this.error("getProjectInfo() - Argument expected: 'done'");
            return;
        }
        this.server.getProject(projectId,
            done, (errorMsg) => {
                this.error("getProjectInfo() - " + errorMsg);
                if (error) {
                    error(errorMsg);
                }
            });
    }

    /**
     * Gets information on the given object, belonging to the given model, within the given project.
     *
     * See [Getting Info on an Object](https://xeokit.github.io/xeokit-bim-viewer/docs/#getting-info-on-an-object) for usage.
     *
     * @param {String} projectId ID of the project to get information on. Must be the ID of one of the projects in the information obtained by {@link BIMViewer#getProjects}.
     * @param {String} modelId ID of a model within the project. Must be the ID of one of the models in the information obtained by {@link BIMViewer#getProjectInfo}.
     * @param {String} objectId ID of an object in the model.
     * @param {Function} done Callback invoked on success, into which the object information JSON is passed.
     * @param {Function} error Callback invoked on failure, into which the error message string is passed.
     */
    getObjectInfo(projectId, modelId, objectId, done, error) {
        if (!projectId) {
            this.error("getObjectInfo() - Argument expected: projectId");
            return;
        }
        if (!modelId) {
            this.error("getObjectInfo() - Argument expected: modelId");
            return;
        }
        if (!objectId) {
            this.error("getObjectInfo() - Argument expected: objectId");
            return;
        }
        if (!done) {
            this.error("getProjectInfo() - Argument expected: 'done'");
            return;
        }
        this.server.getObjectInfo(projectId, modelId, objectId,
            done,
            (errorMsg) => {
                if (error) {
                    error(errorMsg);
                }
            });
    }

    //------------------------------------------------------------------------------------------------------------------
    // Content loading methods
    //------------------------------------------------------------------------------------------------------------------

    /**
     * Loads a project into the viewer.
     *
     * Unloads any currently loaded project and its models first. If the given project is already loaded, will unload that project first.
     *
     * @param {String} projectId ID of the project to load. Must be the ID of one of the projects in the information obtained by {@link BIMViewer#getProjects}.
     * @param {Function} done Callback invoked on success.
     * @param {Function} error Callback invoked on failure, into which the error message string is passed.
     */
    loadProject(projectId, done, error) {
        if (!projectId) {
            this.error("loadProject() - Argument expected: objectId");
            return;
        }
        this._modelsExplorer.loadProject(projectId,
            () => {
                if (done) {
                    done();
                }
            }, (errorMsg) => {
                this.error("loadProject() - " + errorMsg);
                if (error) {
                    error(errorMsg);
                }
            });
    }

    /**
     * Unloads whatever project is currently loaded.
     */
    unloadProject() {
        this._modelsExplorer.unloadProject();
        this.openTab("models");
        this.setControlsEnabled(false); // For quick UI feedback
    }

    /**
     * Returns the ID of the currently loaded project, if any.
     *
     * @returns {String} The ID of the currently loaded project, otherwise ````null```` if no project is currently loaded.
     */
    getLoadedProjectId() {
        return this._modelsExplorer.getLoadedProjectId();
    }

    /**
     * Returns the IDs of the models in the currently loaded project.
     *
     * @returns {String[]} The IDs of the models in the currently loaded project.
     */
    getModelIds() {
        return this._modelsExplorer.getModelIds();
    }

    /**
     * Loads a model into the viewer.
     *
     * Assumes that the project containing the model is currently loaded.
     *
     * @param {String} modelId ID of the model to load. Must be the ID of one of the models in the currently loaded project.
     * @param {Function} done Callback invoked on success.
     * @param {Function} error Callback invoked on failure, into which the error message string is passed.
     */
    loadModel(modelId, done, error) {
        if (!modelId) {
            this.error("loadModel() - Argument expected: modelId");
            return;
        }
        this._modelsExplorer.loadModel(modelId,
            () => {
                if (done) {
                    done();
                }
            }, (errorMsg) => {
                this.error("loadModel() - " + errorMsg);
                if (error) {
                    error(errorMsg);
                }
            });
    }

    /**
     * Load all models in the currently loaded project.
     *
     * Doesn't reload any models that are currently loaded.
     *
     * @param {Function} done Callback invoked on successful loading of the models.
     */
    loadAllModels(done = function () {
    }) {
        const modelIds = this._modelsExplorer.getModelIds();
        const loadNextModel = (i, done2) => {
            if (i >= modelIds.length) {
                done2();
            } else {
                const modelId = modelIds[i];
                if (!this._modelsExplorer.isModelLoaded(modelId)) {
                    this._modelsExplorer.loadModel(modelId, () => {
                        loadNextModel(i + 1, done2);
                    }, (errorMsg) => {
                        this.error("loadAllModels() - " + errorMsg);
                        loadNextModel(i + 1, done2);
                    });
                } else {
                    loadNextModel(i + 1, done2);
                }
            }
        };
        loadNextModel(0, done);
    }

    /**
     * Returns the IDs of the currently loaded models, if any.
     *
     * @returns {String[]} The IDs of the currently loaded models, otherwise an empty array if no models are currently loaded.
     */
    getLoadedModelIds() {
        return this._modelsExplorer._getLoadedModelIds();
    }

    /**
     * Gets if the given model is loaded.
     *
     * @param {String} modelId ID of the model to check. Must be the ID of one of the models in the currently loaded project.
     * @returns {Boolean} True if the given model is loaded.
     */
    isModelLoaded(modelId) {
        if (!modelId) {
            this.error("unloadModel() - Argument expected: modelId");
            return;
        }
        return this._modelsExplorer.isModelLoaded(modelId);
    }

    /**
     * Unloads a model from the viewer.
     *
     * Does nothing if the model is not currently loaded.
     *
     * @param {String} modelId ID of the model to unload.
     */
    unloadModel(modelId) {
        if (!modelId) {
            this.error("unloadModel() - Argument expected: modelId");
            return;
        }
        this._modelsExplorer.unloadModel(modelId);
    }

    /**
     * Unloads all currently loaded models.
     */
    unloadAllModels() {
        this._modelsExplorer.unloadAllModels();
    }

    /**
     * Edits a model.
     *
     * Assumes that the project containing the model is currently loaded.
     *
     * @param {String} modelId ID of the model to edit. Must be the ID of one of the models in the currently loaded project.
     */
    editModel(modelId) {
        this.fire("editModel", {
            modelId: modelId
        });
    }

    /**
     * Deletes a model.
     *
     * Assumes that the project containing the model is currently loaded.
     *
     * @param {String} modelId ID of the model to delete. Must be the ID of one of the models in the currently loaded project.
     */
    deleteModel(modelId) {
        this.fire("deleteModel", {
            modelId: modelId
        });
    }

    /**
     * Adds a model.
     *
     */
    addModel() {
        this.fire("addModel", {});
    }

    /**
     * Sets the viewer's background color.
     *
     * @param {Number[]} rgbColor Three-element array of RGB values, each in range ````[0..1]````.
     */
    setBackgroundColor(rgbColor) {
        this.viewer.scene.canvas.backgroundColor = rgbColor;
    }

    /**
     * Sets where the colors for model objects will be loaded from.
     *
     * Options are:
     *
     * * "model" - (default) load colors from models, and
     * * "viewer" - load colors from the viewer's inbuilt table of colors for IFC types.
     *
     * This is "model" by default.
     *
     * @param {String} source Where colors will be loaded from - "model" or "viewer".
     */
    setObjectColorSource(source) {
        switch (source) {
            case "model":
                break;
            case "viewer":
                break;
            default:
                source = "model";
                this.error("setObjectColorSource() - Unsupported value - accepted values are 'model' and 'viewer' - defaulting to 'model'");
                return;
        }
        this._objectColorSource = source;
    }

    /**
     * Gets where the colors for model objects will be loaded from.
     *
     * This is "model" by default.
     *
     * @return {String} Where colors will be loaded from - "model" to get colors from the model, or "viewer" to get them from the viewer's built-in table of colors for IFC types.
     */
    getObjectColorSource() {
        return this._objectColorSource || "model";
    }

    /**
     * Updates viewer UI state according to the properties in the given object.
     *
     * Note that, since some updates could be animated (e.g. flying the camera to fit objects to view) this
     * method optionally takes a callback, which it invokes after updating the UI.
     *
     * Also, this method is not to be confused with {@link BIMViewer#setConfigs}, which is used to batch-update various configurations and user preferences on the viewer.
     *
     * See [Viewer States](https://xeokit.github.io/xeokit-bim-viewer/docs/#viewer_states) for the list of states that may be batch-updated with this method.
     *
     * @param {Object} viewerState Specifies the viewer UI state updates.
     * @param {Function} done Callback invoked on successful update of the viewer states.
     */
    setViewerState(viewerState, done = () => {
    }) {
        if (viewerState.tabOpen) {
            this.openTab(viewerState.tabOpen);
        }
        if (viewerState.expandObjectsTree) {
            this._objectsExplorer.expandTreeViewToDepth(viewerState.expandObjectsTree);
        }
        if (viewerState.expandClassesTree) {
            this._classesExplorer.expandTreeViewToDepth(viewerState.expandClassesTree);
        }
        if (viewerState.expandStoreysTree) {
            this._storeysExplorer.expandTreeViewToDepth(viewerState.expandStoreysTree);
        }
        if (viewerState.setCamera) {
            this.setCamera(viewerState.setCamera);
        }
        this._parseSelectedStorey(viewerState, () => {
            this._parseThreeDMode(viewerState, () => {
                done();
            });
        });
    }

    _parseSelectedStorey(viewerState, done) {
        if (viewerState.selectedStorey) {
            this.selectStorey(viewerState.selectedStorey);
            done();
        } else {
            done();
        }
    }

    _parseThreeDMode(viewerState, done) {
        const activateThreeDMode = (viewerState.threeDActive !== false);
        this.set3DEnabled(activateThreeDMode, done);
    }

    /**
     * Highlights the given object in the tree views within the Objects, Classes and Storeys tabs.
     *
     * Also scrolls the object's node into view within each tree, then highlights it.
     *
     * De-highlights whatever node is currently highlighted in each of those trees.
     *
     * @param {String} objectId ID of the object
     */
    showObjectInExplorers(objectId) {
        if (!objectId) {
            this.error("showObjectInExplorers() - Argument expected: objectId");
            return;
        }
        this._objectsExplorer.showNodeInTreeView(objectId);
        this._classesExplorer.showNodeInTreeView(objectId);
        this._storeysExplorer.showNodeInTreeView(objectId);
        this.fire("openExplorer", {});
    }

    /**
     * De-highlights the object previously highlighted with {@link BIMViewer#showObjectInExplorers}.
     *
     * This only de-highlights the node. If the node is currently scrolled into view, then the node will remain in view.
     *
     * For each tab, does nothing if a node is currently highlighted.
     */
    unShowObjectInExplorers() {
        this._objectsExplorer.unShowNodeInTreeView();
        this._classesExplorer.unShowNodeInTreeView();
        this._storeysExplorer.unShowNodeInTreeView();
    }

    /**
     * Shows the properties of the given object in the Properties tab.
     *
     * @param {String} objectId ID of the object
     */
    showObjectProperties(objectId) {
        if (!objectId) {
            this.error("showObjectInExplorers() - Argument expected: objectId");
            return;
        }
        if (this._enablePropertiesInspector) {
            this._propertiesInspector.showObjectPropertySets(objectId);
        }
        this.fire("openInspector", {});
    }

    /**
     * Sets whether or not the given objects are visible.
     *
     * @param {String[]} objectIds IDs of objects.
     * @param {Boolean} visible True to set objects visible, false to set them invisible.
     */
    setObjectsVisible(objectIds, visible) {
        this._withObjectsInSubtree(objectIds, (entity) => {
            entity.visible = visible;
        });
    }

    /**
     * Sets the visibility of all objects.
     *
     * @param {Boolean} visible True to set objects visible, false to set them invisible.
     */
    setAllObjectsVisible(visible) {
        if (visible) {
            this.viewer.scene.setObjectsVisible(this.viewer.scene.objectIds, true);
        } else {
            this.viewer.scene.setObjectsVisible(this.viewer.scene.visibleObjectIds, false);
        }
    }

    /**
     * Sets whether or not the given objects are X-rayed.
     *
     * @param {String[]} objectIds IDs of objects.
     * @param {Boolean} xrayed Whether or not to X-ray the objects.
     */
    setObjectsXRayed(objectIds, xrayed) {
        this._withObjectsInSubtree(objectIds, (entity) => {
            entity.xrayed = xrayed;
        });
    }

    /**
     * Sets whether or not all objects are X-rayed.
     *
     * @param {Boolean} xrayed Whether or not to set all objects X-rayed.
     */
    setAllObjectsXRayed(xrayed) {
        if (xrayed) {
            this.viewer.scene.setObjectsXRayed(this.viewer.scene.objectIds, true);
        } else {
            this.viewer.scene.setObjectsXRayed(this.viewer.scene.xrayedObjectIds, false);
        }
    }

    /**
     * Sets whether or not the given objects are selected.
     *
     * @param {String[]} objectIds IDs of objects.
     * @param {Boolean} selected Whether or not to set the objects selected.
     */
    setObjectsSelected(objectIds, selected) {
        this._withObjectsInSubtree(objectIds, (entity) => {
            entity.selected = selected;
        });
    }

    /**
     * Sets whether or not all objects are selected.
     *
     * @param {Boolean} selected Whether or not to set all objects selected.
     */
    setAllObjectsSelected(selected) {
        if (selected) {
            this.viewer.scene.setObjectsSelected(this.viewer.scene.objectIds, true);
        } else {
            this.viewer.scene.setObjectsSelected(this.viewer.scene.selectedObjectIds, false);
        }
    }

    _withObjectsInSubtree(objectIds, callback) {
        if (!objectIds) {
            this.error("Argument expected: objectIds");
            return;
        }
        for (let i = 0, len = objectIds.length; i < len; i++) {
            const objectId = objectIds[i];
            this.viewer.metaScene.withMetaObjectsInSubtree(objectId, (metaObject) => {
                const entity = this.viewer.scene.objects[metaObject.id];
                if (entity) {
                    callback(entity);
                }
            });
        }
    }

    /**
     * Flies the camera to fit the given object in view.
     *
     * @param {String} objectId ID of the object
     * @param {Function} done Callback invoked on completion
     */
    flyToObject(objectId, done) {
        if (!objectId) {
            this.error("flyToObject() - Argument expected: objectId");
            return;
        }
        const viewer = this.viewer;
        const scene = viewer.scene;
        const objectIds = [];
        this.viewer.metaScene.withMetaObjectsInSubtree(objectId, (metaObject) => {
            if (scene.objects[metaObject.id]) {
                objectIds.push(metaObject.id);
            }
        });
        if (objectIds.length === 0) {
            this.error("Object not found in viewer: '" + objectId + "'");
            if (done) {
                done();
            }
            return;
        }
        scene.setObjectsVisible(objectIds, true);
        scene.setObjectsHighlighted(objectIds, true);
        const aabb = scene.getAABB(objectIds);
        viewer.cameraFlight.flyTo({
            aabb: aabb
        }, () => {
            if (done) {
                done();
            }
            setTimeout(function () {
                scene.setObjectsHighlighted(scene.highlightedObjectIds, false);
            }, 500);
        });
        viewer.cameraControl.pivotPos = f.getAABB3Center(aabb);
    }

    /**
     * Flies the camera to fit the given objects in view.
     *
     * @param {String[]} objectIds IDs of the objects
     * @param {Function} done Callback invoked on completion
     */
    viewFitObjects(objectIds, done) {
        if (!objectIds) {
            this.error("flyToObject() - Argument expected: objectIds");
            return;
        }
        const viewer = this.viewer;
        const scene = viewer.scene;

        const entityIds = [];

        for (var i = 0, len = objectIds.length; i < len; i++) {
            const objectId = objectIds[i];
            this.viewer.metaScene.withMetaObjectsInSubtree(objectId, (metaObject) => {
                if (scene.objects[metaObject.id]) {
                    entityIds.push(metaObject.id);
                }
            });
        }
        if (entityIds.length === 0) {
            if (done) {
                done();
            }
            return;
        }
        scene.setObjectsVisible(entityIds, true);
        scene.setObjectsHighlighted(entityIds, true);
        const aabb = scene.getAABB(entityIds);
        viewer.cameraFlight.flyTo({
            aabb: aabb
        }, () => {
            if (done) {
                done();
            }
            setTimeout(function () {
                scene.setObjectsHighlighted(scene.highlightedObjectIds, false);
            }, 500);
        });
        viewer.cameraControl.pivotPos = f.getAABB3Center(aabb);
    }

    /**
     * Flies the camera to fit all objects in view.
     *
     * @param {Function} done Callback invoked on completion
     */
    viewFitAll(done) {
        const viewer = this.viewer;
        const scene = viewer.scene;
        const aabb = scene.getAABB();
        viewer.cameraFlight.flyTo({
            aabb: aabb
        }, () => {
            if (done) {
                done();
            }
        });
        viewer.cameraControl.pivotPos = f.getAABB3Center(aabb);
    }

    /**
     * Jumps the camera to fit the given object in view.
     *
     * @param {String} objectId ID of the object
     */
    jumpToObject(objectId) {
        if (!objectId) {
            this.error("jumpToObject() - Argument expected: objectId");
            return;
        }
        const viewer = this.viewer;
        const scene = viewer.scene;
        const objectIds = [];
        this.viewer.metaScene.withMetaObjectsInSubtree(objectId, (metaObject) => {
            if (scene.objects[metaObject.id]) {
                objectIds.push(metaObject.id);
            }
        });
        if (objectIds.length === 0) {
            this.error("Object not found in viewer: '" + objectId + "'");
            return;
        }
        scene.setObjectsVisible(objectIds, true);
        const aabb = scene.getAABB(objectIds);
        viewer.cameraFlight.jumpTo({
            aabb: aabb
        });
        viewer.cameraControl.pivotPos = f.getAABB3Center(aabb);
    }

    /**
     * Sets the camera to the given position.
     *
     * @param {Number[]} [params.eye] Eye position.
     * @param {Number[]} [params.look] Point of interest.
     * @param {Number[]} [params.up] Direction of "up".
     */
    setCamera(params) {
        const viewer = this.viewer;
        const scene = viewer.scene;
        const camera = scene.camera;
        if (params.eye) {
            camera.eye = params.eye;
        }
        if (params.look) {
            camera.look = params.look;
        }
        if (params.up) {
            camera.up = params.up;
        }
    }

    /**
     * Fits the given models in view.
     *
     * @param {String[]} modelIds ID of the models.
     * @param {Function} [done] Callback invoked on completion. Will be animated if this is given, otherwise will be instantaneous.
     */
    viewFitModels(modelIds, done) {
        if (!modelIds) {
            this.error("viewFitModels() - Argument expected: modelIds");
            return;
        }
        const viewer = this.viewer;
        const scene = viewer.scene;
        const aabb = f.AABB3();
        f.collapseAABB3(aabb);
        for (var i = 0, len = modelIds.length; i < len; i++) {
            const modelId = modelIds[i];
            const model = scene.models[modelId];
            if (!model) {
                this.error("Model not found in viewer: '" + modelId + "'");
                continue;
            }
            model.visible = true;
            model.highlighted = true;
            f.expandAABB3(aabb, model.aabb);
        }
        if (done) {
            viewer.cameraFlight.flyTo({
                aabb: aabb
            }, () => {
                done();
                setTimeout(function () {
                    scene.setObjectsHighlighted(scene.highlightedObjectIds, false);
                }, 500);
            });
        } else {
            viewer.cameraFlight.jumpTo({
                aabb: aabb
            });
            setTimeout(function () {
                scene.setObjectsHighlighted(scene.highlightedObjectIds, false);
            }, 500);
        }
        viewer.cameraControl.pivotPos = f.getAABB3Center(aabb);
    }

    /**
     * Opens the specified viewer tab.
     *
     * The available tabs are:
     *
     *  * "models" - the Models tab, which lists the models available within the currently loaded project,
     *  * "objects" - the Objects tab, which contains a tree view for each loaded model, organized to indicate the containment hierarchy of their objects,
     *  * "classes" - the Classes tab, which contains a tree view for each loaded model, with nodes grouped by IFC types of their objects,
     *  * "storeys" - the Storeys tab, which contains a tree view for each loaded model, with nodes grouped within ````IfcBuildingStoreys````, sub-grouped by their IFC types, and
     *  * "properties" - the Properties tab, which shows property sets for a given object.
     *
     * @param {String} tabId ID of the tab to open - see method description.
     */
    openTab(tabId) {
        if (!tabId) {
            this.error("openTab() - Argument expected: tabId");
            return;
        }
        let tabSelector;
        switch (tabId) {
            case "models":
                tabSelector = "xeokit-modelsTab";
                break;
            case "objects":
                tabSelector = "xeokit-objectsTab";
                break;
            case "classes":
                tabSelector = "xeokit-classesTab";
                break;
            case "storeys":
                tabSelector = "xeokit-storeysTab";
                break;
            case "properties":
                tabSelector = "xeokit-propertiesTab";
                break;
            default:
                this.error("openTab() - tab not recognized: '" + tabId + "'");
                return;
        }
        this._openTab(this._explorerElement, tabSelector);
        //     this._openTab(this._inspectorElement, tabSelector);
    }

    _openTab(element, tabSelector) {
        const tabClass = 'xeokit-tab';
        const activeClass = 'active';
        let tabs = element.querySelectorAll("." + tabClass);
        let tab = element.querySelector("." + tabSelector);
        for (let i = 0; i < tabs.length; i++) {
            let tabElement = tabs[i];
            if (tabElement.isEqualNode(tab)) {
                tabElement.classList.add(activeClass);
            } else {
                tabElement.classList.remove(activeClass);
            }
        }
    }

    /**
     * Returns the ID of the currently open viewer tab.
     *
     * The available tabs are:
     *
     *  * "models" - the Models tab, which lists the models available within the currently loaded project,
     *  * "objects" - the Objects tab, which contains a tree view for each loaded model, organized to indicate the containment hierarchy of their objects,
     *  * "classes" - the Classes tab, which contains a tree view for each loaded model, with nodes grouped by IFC types of their objects,
     *  * "storeys" - the Storeys tab, which contains a tree view for each loaded model, with nodes grouped within ````IfcBuildingStoreys````, sub-grouped by their IFC types,
     *  * "properties" - the Properties tab, which shows property sets for a given object, and
     *  * "none" - no tab is open; this is unlikely, since one of the above tabs should be open at a any time, but here for robustness.
     */
    getOpenTab() {
        function hasClass(element, className) {
            if (!element) {
                return false;
            }
            return (" " + element.className + " ").indexOf(" " + className + " ") > -1;
        }

        const activeClass = 'active';
        let modelsTab = this._explorerElement.querySelector(".xeokit-modelsTab");
        if (hasClass(modelsTab, activeClass)) {
            return "models";
        }
        let objectsTab = this._explorerElement.querySelector(".xeokit-objectsTab");
        if (hasClass(objectsTab, activeClass)) {
            return "objects";
        }
        let classesTab = this._explorerElement.querySelector(".xeokit-classesTab");
        if (hasClass(classesTab, activeClass)) {
            return "classes";
        }
        let storeysTab = this._explorerElement.querySelector(".xeokit-storeysTab");
        if (hasClass(storeysTab, activeClass)) {
            return "storeys";
        }
        let propertiesTab = this._inspectorElement.querySelector(".xeokit-propertiesTab");
        if (hasClass(propertiesTab, activeClass)) {
            return "properties";
        }
        return "none";
    }

    /**
     * Switches the viewer between 2D and 3D viewing modes.
     *
     * @param {Boolean} enabled Set true to switch into 3D mode, else false to switch into 2D mode.
     * @param {Function} done Callback to invoke when switch complete. Supplying this callback causes an animated transition. Otherwise, the transition will be instant.
     */
    set3DEnabled(enabled, done) {
        this._threeDMode.setActive(enabled, done);
    }

    /**
     * Gets whether the viewer is in 3D or 2D viewing mode.
     *
     * @returns {boolean} True when in 3D mode, else false.
     */
    get3DEnabled() {
        return this._threeDMode.getActive();
    }

    /**
     * Sets whether IFCSpace types are ever shown.
     *
     * @param {Boolean} shown Set true to allow IFCSpaces to be shown, else false to always keep them hidden.
     */
    setSpacesShown(shown) {
        this._showSpacesMode.setActive(shown);
    }

    /**
     * Gets whether the viewer allows IFCSpace types to be shown.
     *
     * @returns {boolean} True to allow IFCSpaces to be shown, else false to always keep them hidden.
     */
    getSpacesShown() {
        return this._showSpacesMode.getActive();
    }

    /**
     * Sets whether the viewer is in orthographic viewing mode.
     *
     * The viewer is either in orthographic mode or perspective mode. The viewer is in perspective mode by default.
     *
     * @param {Boolean} enabled Set true to switch into ortho mode, else false to switch into perspective mode.
     * @param {Function} done Callback to invoke when switch complete. Supplying this callback causes an animated transition. Otherwise, the transition will be instant.
     */
    setOrthoEnabled(enabled, done) {
        this._orthoMode.setActive(enabled, done);
    }

    /**
     * Gets whether the viewer is in orthographic viewing mode.
     *
     * The viewer is either in orthographic mode or perspective mode. The viewer is in perspective mode by default.
     *
     * @returns {boolean} True when in ortho mode, else false when in perspective mode.
     */
    getOrthoEnabled() {
        return this._orthoMode.getActive();
    }

    /**
     * Transitions the viewer into an isolated view of the given building storey.
     *
     * Does nothing and logs an error if no object of the given ID is in the viewer, or if the object is not an ````IfcBuildingStorey````.
     *
     * @param {String} storeyObjectId ID of an ````IfcBuildingStorey```` object.
     * @param {Function} [done] Optional callback to invoke on completion. When provided, the transition will be animated, with the camera flying into position. Otherwise, the transition will be instant, with the camera jumping into position.
     */
    selectStorey(storeyObjectId, done) {
        const metaScene = this.viewer.metaScene;
        const storeyMetaObject = metaScene.metaObjects[storeyObjectId];
        if (!storeyMetaObject) {
            this.error("selectStorey() - Object is not found: '" + storeyObjectId + "'");
            return;
        }
        if (storeyMetaObject.type !== "IfcBuildingStorey") {
            this.error("selectStorey() - Object is not an IfcBuildingStorey: '" + storeyObjectId + "'");
            return;
        }
        this._storeysExplorer.selectStorey(storeyObjectId, done);
    }

    /**
     * Saves viewer state to a BCF viewpoint.
     *
     * This does not save information about the project and model(s) that are currently loaded. When loading the viewpoint,
     * the viewer will assume that the same project and models will be currently loaded (the BCF viewpoint specification
     * does not contain that information).
     *
     * Note that xeokit's {@link Camera#look} is the **point-of-interest**, whereas the BCF ````camera_direction```` is a
     * direction vector. Therefore, we save ````camera_direction```` as the vector from {@link Camera#eye} to {@link Camera#look}.
     *
     * @param {*} [options] Options for getting the viewpoint.
     * @param {Boolean} [options.spacesVisible=false] Indicates whether ````IfcSpace```` types should be forced visible in the viewpoint.
     * @param {Boolean} [options.openingsVisible=false] Indicates whether ````IfcOpening```` types should be forced visible in the viewpoint.
     * @param {Boolean} [options.spaceBoundariesVisible=false] Indicates whether the boundaries of ````IfcSpace```` types should be visible in the viewpoint.
     * @param {Boolean} [options.reverseClippingPlanes=false] When ````true````, clipping planes are reversed (https://github.com/buildingSMART/BCF-XML/issues/193)
     * @param {Boolean} [options.defaultInvisible=false] When ````true````, will save the default visibility of all objects
     * as ````false````. This means that when we load the viewpoint again, and there are additional models loaded that
     * were not saved in the viewpoint, those models will be hidden when we load the viewpoint, and that only the
     * objects in the viewpoint will be visible.
     * @returns {*} BCF JSON viewpoint object
     * @example
     *
     * const viewpoint = bimViewer.saveBCFViewpoint({
     *     spacesVisible: false,          // Default
     *     spaceBoundariesVisible: false, // Default
     *     openingsVisible: false         // Default
     * });
     *
     * // viewpoint will resemble the following:
     *
     * {
     *     perspective_camera: {
     *         camera_view_point: {
     *             x: 0.0,
     *             y: 0.0,
     *             z: 0.0
     *         },
     *         camera_direction: {
     *             x: 1.0,
     *             y: 1.0,
     *             z: 2.0
     *         },
     *         camera_up_vector: {
     *             x: 0.0,
     *             y: 0.0,
     *             z: 1.0
     *         },
     *         field_of_view: 90.0
     *     },
     *     lines: [],
     *     clipping_planes: [{
     *         location: {
     *             x: 0.5,
     *             y: 0.5,
     *             z: 0.5
     *         },
     *         direction: {
     *             x: 1.0,
     *             y: 0.0,
     *             z: 0.0
     *         }
     *     }],
     *     bitmaps: [],
     *     snapshot: {
     *         snapshot_type: png,
     *         snapshot_data: "data:image/png;base64,......"
     *     },
     *     components: {
     *         visibility: {
     *             default_visibility: false,
     *             exceptions: [{
     *                 ifc_guid: 4$cshxZO9AJBebsni$z9Yk,
     *                 originating_system: xeokit.io,
     *                 authoring_tool_id: xeokit/v1.0
     *             }]
     *        },
     *         selection: [{
     *            ifc_guid: "4$cshxZO9AJBebsni$z9Yk",
     *         }]
     *     }
     * }
     */
    saveBCFViewpoint(options) {
        return this._bcfViewpointsPlugin.getViewpoint(options);
    }

    /**
     * Sets viewer state to the given BCF viewpoint.
     *
     * This assumes that the viewer currently contains the same project and model(s) that were loaded at the time that the
     * viewpoint was originally saved (the BCF viewpoint specification does not contain that information).
     *
     * Note that xeokit's {@link Camera#look} is the **point-of-interest**, whereas the BCF ````camera_direction```` is a
     * direction vector. Therefore, when loading a BCF viewpoint, we set {@link Camera#look} to the absolute position
     * obtained by offsetting the BCF ````camera_view_point````  along ````camera_direction````.
     *
     * When loading a viewpoint, we also have the option to find {@link Camera#look} as the closest point of intersection
     * (on the surface of any visible and pickable {@link Entity}) with a 3D ray fired from ````camera_view_point```` in
     * the direction of ````camera_direction````.
     *
     * @param {*} bcfViewpoint  BCF JSON viewpoint object or "reset" / "RESET" to reset the viewer, which clears SectionPlanes,
     * shows default visible entities and restores camera to initial default position.
     * @param {*} [options] Options for setting the viewpoint.
     * @param {Boolean} [options.rayCast=true] When ````true```` (default), will attempt to set {@link Camera#look} to the closest
     * point of surface intersection with a ray fired from the BCF ````camera_view_point```` in the direction of ````camera_direction````.
     * @param {Boolean} [options.immediate=true] When ````true```` (default), immediately set camera position.
     * @param {Boolean} [options.duration] Flight duration in seconds.  Overrides {@link CameraFlightAnimation#duration}.
     * @param {Boolean} [options.reset=true] When ````true```` (default), set {@link Entity#xrayed} and {@link Entity#highlighted} ````false```` on all scene objects.
     * @param {Boolean} [options.reverseClippingPlanes=false] When ````true````, clipping planes are reversed (https://github.com/buildingSMART/BCF-XML/issues/193)
     * @param {Boolean} [options.updateCompositeObjects=false] When ````true````, then when visibility and selection updates refer to composite objects (eg. an IfcBuildingStorey),
     * then this method will apply the updates to objects within those composites.
     */
    loadBCFViewpoint(bcfViewpoint, options) {
        if (!bcfViewpoint) {
            this.error("loadBCFViewpoint() - Argument expected: bcfViewpoint");
            return;
        }
        this._orthoMode.setActive(this.viewer.camera.projection === "ortho");
        this._bcfViewpointsPlugin.setViewpoint(bcfViewpoint, options);
    }

    /**
     * Resets the view.
     *
     * This resets object appearances (visibility, selection, highlight and X-ray), sets camera to
     * default position, and removes section planes.
     */
    resetView() {
        this._resetAction.reset();
    }

    /**
     * Enables or disables the various buttons and controls throughout the viewer.
     *
     * This also makes various buttons appear disabled.
     *
     * @param {Boolean} enabled Whether or not to disable the controls.
     */
    setControlsEnabled(enabled) {

        // Explorer

        // Models tab is always enabled
        this._objectsExplorer.setEnabled(enabled);
        this._classesExplorer.setEnabled(enabled);
        this._storeysExplorer.setEnabled(enabled);

        // Toolbar

        this._resetAction.setEnabled(enabled);
        this._fitAction.setEnabled(enabled);
        this._threeDMode.setEnabled(enabled);
        this._orthoMode.setEnabled(enabled);
        this._firstPersonMode.setEnabled(enabled);
        this._queryTool.setEnabled(enabled);
        this._hideTool.setEnabled(enabled);
        this._selectionTool.setEnabled(enabled);
        this._showSpacesMode.setEnabled(enabled);
        this._sectionTool.setEnabled(enabled);

        //
        if (this._enablePropertiesInspector) {
            this._propertiesInspector.setEnabled(enabled);
        }
    }

    /**
     * Sets whether or not keyboard camera control is enabled.
     *
     * This is useful when we don't want key events over the canvas to clash with other UI elements outside the canvas.
     *
     * Default value is ````true````.
     *
     * @param {Boolean} enabled Set ````true```` to enable keyboard input.
     */
    setKeyboardEnabled(enabled) {
        this.viewer.scene.input.keyboardEnabled = enabled;
    }

    /**
     * Gets whether keyboard camera control is enabled.
     *
     * This is useful when we don't want key events over the canvas to clash with other UI elements outside the canvas.
     *
     * Default value is ````true````.
     *
     * @returns {Boolean} Returns ````true```` if keyboard input is enabled.
     */
    getKeyboardEnabled() {
        return this.viewer.scene.input.keyboardEnabled;
    }

    /**
     * Clears sections.
     *
     * Sections are the slicing planes, that we use to section models in order to see interior structures.
     */
    clearSections() {
        this._sectionTool.clear();
    }


    /**
     * Inverts the direction of sections.
     */
    flipSections() {
        this._sectionTool.flipSections();
    }

    /**
     * Hides the section edition control, if currently shown.
     */
    hideSectionEditControl() {
        this._sectionTool.hideControl();
    }

    /**
     * Returns the number of sections that currently exist.
     *
     * sections are the sliceing planes, that we use to slice models in order to see interior structures.
     *
     * @returns {Number} The number of sections.
     */
    getNumSections() {
        return this._sectionTool.getNumSections();
    }

    /**
     * Destroys the viewer, freeing all resources.
     */
    destroy() {
        this.viewer.destroy();
        this._bcfViewpointsPlugin.destroy();
        this._canvasContextMenu.destroy();
        this._objectContextMenu.destroy();
    }
}

// export { BIMViewer, jE as LocaleService, Server };