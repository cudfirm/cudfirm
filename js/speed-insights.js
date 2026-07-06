/**
 * ================================================
 *  VERCEL SPEED INSIGHTS INITIALIZATION
 *  Tracks web performance metrics automatically
 * ================================================
 */

// Initialize the Speed Insights queue
(function() {
  if (window.si) return; // Already initialized
  
  // Create the queue function
  window.si = window.si || function () {
    (window.siq = window.siq || []).push(arguments);
  };
  
  // Inject the Speed Insights script
  var script = document.createElement('script');
  script.defer = true;
  script.src = '/_vercel/speed-insights/script.js';
  
  // Append to head or body
  (document.head || document.body).appendChild(script);
})();
