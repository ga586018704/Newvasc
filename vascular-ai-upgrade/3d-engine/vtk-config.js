// vite.config.ts или webpack.config.js
export default {
  optimizeDeps: {
    exclude: ['@kitware/vtk.js'] // VTK.js тяжелый, не оптимизируем
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true // Для itk.js
    }
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp' // Для SharedArrayBuffer (VTK multithreading)
    }
  }
};
