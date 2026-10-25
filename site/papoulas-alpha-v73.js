/* TO Eventos V7.3: transparência por cor para o vídeo original das papoulas.
   Sem recorte espacial: preserva pétalas e caules completos.
   Falha segura: se WebGL não funcionar, o vídeo original permanece visível. */
(() => {
  'use strict';
  const video = document.querySelector('#sobre .about-floral-video');
  const figure = video?.closest('.botanical-motion');
  if (!figure) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'to-papoulas-alpha';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', {
    alpha:true, premultipliedAlpha:false, antialias:false, depth:false,
    preserveDrawingBuffer:false, powerPreference:'low-power'
  });
  if (!gl) return;

  const compile = (type, source) => {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, source);
    gl.compileShader(sh);
    return gl.getShaderParameter(sh,gl.COMPILE_STATUS) ? sh : null;
  };
  const vertex = compile(gl.VERTEX_SHADER,
    'attribute vec2 a_pos; varying vec2 uv; void main(){uv=a_pos*.5+.5;gl_Position=vec4(a_pos,0.,1.);}');
  const fragment = compile(gl.FRAGMENT_SHADER, [
    'precision mediump float;uniform sampler2D frame;varying vec2 uv;',
    'void main(){',
    'vec3 p=texture2D(frame,uv).rgb;',
    'vec3 bg=(texture2D(frame,vec2(.025,.025)).rgb+',
    'texture2D(frame,vec2(.975,.025)).rgb+',
    'texture2D(frame,vec2(.025,.975)).rgb+',
    'texture2D(frame,vec2(.975,.975)).rgb)*.25;',
    'float dist=length(p-bg);',
    'float chroma=max(max(p.r,p.g),p.b)-min(min(p.r,p.g),p.b);',
    'float a=max(smoothstep(.035,.14,dist),smoothstep(.06,.14,chroma));',
    'if(a<.006)discard;',
    'vec3 clean=clamp((p-bg*(1.-a))/max(a,.006),0.,1.);',
    'gl_FragColor=vec4(clean,a);}'
  ].join(''));
  if (!vertex || !fragment) return;
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program,gl.LINK_STATUS)) return;
  gl.useProgram(program);
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,quad);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(program,'a_pos');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
  gl.uniform1i(gl.getUniformLocation(program,'frame'),0);
  gl.clearColor(0,0,0,0);
  figure.appendChild(canvas);

  let visible=true, stopped=false, raf=0, lastFrame=-1;
  const render=()=>{
    if (stopped || video.readyState<2 || !video.videoWidth) return;
    const w=Math.max(1,Math.min(video.videoWidth,720,
      Math.round(video.clientWidth*Math.min(devicePixelRatio||1,1.5))));
    const h=Math.round(w*video.videoHeight/video.videoWidth);
    if (w!==canvas.width || h!==canvas.height) {
      canvas.width=w; canvas.height=h; gl.viewport(0,0,w,h);
    }
    if (video.currentTime!==lastFrame || !figure.classList.contains('to-papoulas-keyed')) {
      try {
        gl.bindTexture(gl.TEXTURE_2D,tex);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
        if (gl.getError()!==gl.NO_ERROR) return;
        lastFrame=video.currentTime;
        figure.classList.add('to-papoulas-keyed');
      } catch { return; }
    }
    // v7.js permanece responsável pelo timing de entrada e replay.
    canvas.style.opacity=video.style.opacity||'1';
  };
  const tick=()=>{
    raf=0;
    if (!visible || stopped || document.hidden) return;
    render();
    raf=requestAnimationFrame(tick);
  };
  const resume=()=>{if (visible && !stopped && !document.hidden && !raf)raf=requestAnimationFrame(tick);};
  ['loadeddata','seeked','play','pause','timeupdate'].forEach(e=>
    video.addEventListener(e,()=>{render();resume();}));
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries=>{
      visible=entries.some(e=>e.isIntersecting);
      if (visible)resume();
      else {cancelAnimationFrame(raf);raf=0;}
    },{rootMargin:'100px'}).observe(figure);
  }
  document.addEventListener('visibilitychange',()=>{
    if (document.hidden){cancelAnimationFrame(raf);raf=0;}
    else resume();
  });
  canvas.addEventListener('webglcontextlost',e=>{
    e.preventDefault();stopped=true;cancelAnimationFrame(raf);
    figure.classList.remove('to-papoulas-keyed');
  });
  if (video.readyState>=2)render();
  resume();
})();