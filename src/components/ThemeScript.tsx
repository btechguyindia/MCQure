// Applies the saved theme combination before first paint to avoid a flash.
// Two independent axes: color identity (data-theme) + appearance (.dark).
"use client";

export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{
var t=localStorage.getItem('mcqure-tier-theme');
var c=(t==='gold'||t==='silver')?t:localStorage.getItem('mcqure-theme-color');
if(c!=='teal'&&c!=='purple'&&c!=='blue-gold'&&c!=='gold'&&c!=='silver')c='teal';
document.documentElement.setAttribute('data-theme',c);
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
