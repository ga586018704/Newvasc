import React, { useEffect, useRef, useState } from 'react';
import '@kitware/vtk.js/Rendering/Profiles/Volume';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';

interface Dicom3DViewerProps {
  dicomSeries: ArrayBuffer; // Загруженные DICOM файлы
  vesselMask?: {
    data: Uint8Array;
    dimensions: [number, number, number];
    origin: [number, number, number];
    spacing: [number, number, number];
    color: [number, number, number];
  };
  preset?: 'arterial' | 'venous' | 'bone' | 'soft_tissue';
}

const PRESETS = {
  arterial: {
    color: [[0, 0, 0, 0], [500, 1, 0.5, 0.3], [1000, 1, 1, 1]],
    opacity: [[0, 0], [200, 0], [400, 0.8], [1000, 1]]
  },
  venous: {
    color: [[0, 0, 0, 0], [300, 0, 0, 1], [600, 0.8, 0.2, 0]],
    opacity: [[0, 0], [150, 0], [300, 0.6], [800, 0.8]]
  }
};

export const Dicom3DViewer: React.FC<Dicom3DViewerProps> = ({ 
  dicomSeries, 
  vesselMask,
  preset = 'arterial'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const vtkContextRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Инициализация VTK
    const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
      container: containerRef.current,
      background: [0, 0, 0]
    });
    
    const renderer = fullScreenRenderer.getRenderer();
    const renderWindow = fullScreenRenderer.getRenderWindow();

    // Парсинг DICOM (упрощенно — в реальности через itk.js или cornerstone)
    const imageData = parseDicomToVTKImage(dicomSeries);
    
    // Volume для DICOM
    const volumeMapper = vtkVolumeMapper.newInstance();
    volumeMapper.setInputData(imageData);
    
    const volume = vtkVolume.newInstance();
    volume.setMapper(volumeMapper);
    
    // Настройка Transfer Functions
    const colorTF = vtkColorTransferFunction.newInstance();
    const opacityTF = vtkPiecewiseFunction.newInstance();
    
    const selectedPreset = PRESETS[preset];
    selectedPreset.color.forEach(([x, r, g, b]: number[]) => {
      colorTF.addRGBPoint(x, r, g, b);
    });
    selectedPreset.opacity.forEach(([x, y]: number[]) => {
      opacityTF.addPoint(x, y);
    });
    
    volume.getProperty().setRGBTransferFunction(0, colorTF);
    volume.getProperty().setScalarOpacity(0, opacityTF);
    volume.getProperty().setColorLevel(400);
    volume.getProperty().setColorWindow(800);

    renderer.addVolume(volume);

    // Добавление маски сосуда если есть
    if (vesselMask) {
      const maskImageData = vtkImageData.newInstance();
      maskImageData.setDimensions(vesselMask.dimensions);
      maskImageData.setOrigin(vesselMask.origin);
      maskImageData.setSpacing(vesselMask.spacing);
      
      const scalars = vtkDataArray.newInstance({
        values: vesselMask.data,
        numberOfComponents: 1,
        dataType: 'Uint8Array'
      });
      maskImageData.getPointData().setScalars(scalars);
      
      const maskMapper = vtkVolumeMapper.newInstance();
      maskMapper.setInputData(maskImageData);
      
      const maskVolume = vtkVolume.newInstance();
      maskVolume.setMapper(maskMapper);
      
      // Красный полупрозрачный для сосуда
      const maskColor = vtkColorTransferFunction.newInstance();
      maskColor.addRGBPoint(0, 0, 0, 0);
      maskColor.addRGBPoint(1, vesselMask.color[0], vesselMask.color[1], vesselMask.color[2]);
      
      const maskOpacity = vtkPiecewiseFunction.newInstance();
      maskOpacity.addPoint(0, 0);
      maskOpacity.addPoint(1, 0.4); // Полупрозрачность
      
      maskVolume.getProperty().setRGBTransferFunction(0, maskColor);
      maskVolume.getProperty().setScalarOpacity(0, maskOpacity);
      
      renderer.addVolume(maskVolume);
    }

    renderer.resetCamera();
    renderWindow.render();
    
    vtkContextRef.current = { fullScreenRenderer, renderWindow };
    setIsLoading(false);

    // Cleanup
    return () => {
      if (vtkContextRef.current) {
        vtkContextRef.current.fullScreenRenderer.delete();
      }
    };
  }, [dicomSeries, vesselMask, preset]);

  // Управление камерой
  const resetCamera = () => {
    if (vtkContextRef.current) {
      vtkContextRef.current.fullScreenRenderer.getRenderer().resetCamera();
      vtkContextRef.current.renderWindow.render();
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '600px' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {isLoading && <div style={{ position: 'absolute', top: '50%', left: '50%' }}>Loading 3D...</div>}
      
      <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.7)', color: 'white', padding: 10 }}>
        <button onClick={resetCamera}>Reset View</button>
        <div>3D Reconstruction Active</div>
      </div>
    </div>
  );
};

// Вспомогательная функция (требует полноценного DICOM parser)
function parseDicomToVTKImage(dicomBuffer: ArrayBuffer): any {
  // Заглушка — в реальности используйте itk.js или cornerstoneWADOImageLoader
  // для преобразования DICOM в vtkImageData
  return vtkImageData.newInstance();
}
