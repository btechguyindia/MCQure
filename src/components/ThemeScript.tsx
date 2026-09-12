// Applies the saved theme combination before first paint to avoid a flash.
// Two independent axes: color identity (data-theme) + appearance (.dark).
"use client";

export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{
var g=localStorage.getItem('mcqure-go');
var t=localStorage.getItem('mcqure-tier-theme');
var c=g==='on'?'neo':((t==='royal'||t==='gold'||t==='silver')?t:localStorage.getItem('mcqure-theme-color'));
if(c!=='teal'&&c!=='purple'&&c!=='blue-gold'&&c!=='claude'&&c!=='gold'&&c!=='silver'&&c!=='royal'&&c!=='custom'&&c!=='neo')c='teal';
document.documentElement.setAttribute('data-theme',c);
if(c==='custom'){
var r=/^#[0-9a-f]{6}$/i;
function hx(k,d){var v=localStorage.getItem(k);return r.test(v)?v:d;}
var st=document.documentElement.style;
st.setProperty('--mcq-u-primary',hx('mcqure-custom-primary','#0f9d8a'));
st.setProperty('--mcq-u-secondary',hx('mcqure-custom-secondary','#0ea5a4'));
}
var a=localStorage.getItem('mcqure-appearance');
if(a!=='light'&&a!=='dark'&&a!=='system'){
a=localStorage.getItem('mcqure-theme')==='dark'?'dark':'system';
}
var dark=a==='dark'||(a==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
document.documentElement.classList.toggle('dark',dark);
}catch(e){}})();`,
      }}
    />
  );
}
