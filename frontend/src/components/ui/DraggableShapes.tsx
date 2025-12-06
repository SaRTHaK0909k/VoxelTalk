import { useRef, useState, useEffect } from 'react';
import { Circle, Rect, Line, Text, Transformer } from 'react-konva';
import type { ShapeProps } from '@/screens/canvas';

interface DraggableShapeProps extends ShapeProps {
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: ShapeProps) => void;
}

export default function DraggableShape({ 
  isSelected, 
  onSelect, 
  onChange, 
  ...shapeProps 
}: DraggableShapeProps) {
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const handleTextDblClick = () => {
    if (shapeProps.type !== 'text') return;
    setIsEditing(true);

    // Create text input over the shape
    const textNode = shapeRef.current;
    const stage = textNode.getStage();
    const textPosition = textNode.absolutePosition();

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    textarea.value = shapeProps.text || '';
    textarea.style.position = 'absolute';
    textarea.style.top = `${textPosition.y}px`;
    textarea.style.left = `${textPosition.x}px`;
    textarea.style.width = `${textNode.width() - textNode.padding() * 2}px`;
    textarea.style.height = `${textNode.height() - textNode.padding() * 2}px`;
    textarea.style.fontSize = '16px';
    textarea.style.border = 'none';
    textarea.style.padding = '0px';
    textarea.style.margin = '0px';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'none';
    textarea.style.outline = '1px solid #00ff00';
    textarea.style.resize = 'none';
    textarea.style.transformOrigin = 'left top';
    textarea.style.color = shapeProps.strokeColor;

    textarea.focus();

    textarea.addEventListener('blur', () => {
      onChange({
        ...shapeProps,
        text: textarea.value
      });
      document.body.removeChild(textarea);
      setIsEditing(false);
    });
  };

  return (
    <>
      {shapeProps.type === 'rectangle' && (
        <Rect
          {...shapeProps}
          ref={shapeRef}
          draggable
          onClick={onSelect}
          onTap={onSelect}
          onDragEnd={(e) => {
            onChange({
              ...shapeProps,
              x: e.target.x(),
              y: e.target.y()
            });
          }}
          onTransformEnd={() => {
            const node = shapeRef.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            node.scaleX(1);
            node.scaleY(1);
            onChange({
              ...shapeProps,
              x: node.x(),
              y: node.y(),
              width: Math.abs(node.width() * scaleX),
              height: Math.abs(node.height() * scaleY)
            });
          }}
        />
      )}
        {shapeProps.type === 'circle' && (
        <Circle
            {...shapeProps}
            ref={shapeRef}
            draggable
            onClick={onSelect}
            onTap={onSelect}
            onDragEnd={(e) => {
            onChange({
                ...shapeProps,
                x: e.target.x(),
                y: e.target.y()
            });
            }}
            onTransformEnd={() => {
            const node = shapeRef.current;
            const scaleX = node.scaleX();
            node.scaleX(1);
            node.scaleY(1);
            onChange({
                ...shapeProps,
                x: node.x(),
                y: node.y(),
                radius: Math.abs(node.radius() * scaleX)
            });
            }}
        />
        )}

        {shapeProps.type === 'line' && (
        <Line
            {...shapeProps}
            ref={shapeRef}
            draggable
            onClick={onSelect}
            onTap={onSelect}
            onDragEnd={(e) => {
            onChange({
                ...shapeProps,
                x: e.target.x(),
                y: e.target.y()
            });
            }}
            onTransformEnd={() => {
            const node = shapeRef.current;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            node.scaleX(1);
            node.scaleY(1);
            
            const points = node.points().slice();
            for (let i = 0; i < points.length; i += 2) {
                points[i] *= scaleX;
                points[i + 1] *= scaleY;
            }
            
            onChange({
                ...shapeProps,
                x: node.x(),
                y: node.y(),
                points: points
            });
            }}
        />
        )}
      {shapeProps.type === 'text' && (
        <Text
          {...shapeProps}
          ref={shapeRef}
          draggable
          onClick={onSelect}
          onTap={onSelect}
          onDblClick={handleTextDblClick}
          onDragEnd={(e) => {
            onChange({
              ...shapeProps,
              x: e.target.x(),
              y: e.target.y()
            });
          }}
          onTransformEnd={() => {
            const node = shapeRef.current;
            const scaleX = node.scaleX();
            node.scaleX(1);
            onChange({
              ...shapeProps,
              x: node.x(),
              y: node.y(),
              width: Math.abs(node.width() * scaleX)
            });
          }}
          fontSize={16}
          padding={5}
        />
      )}
      {isSelected && !isEditing && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize
            const minSize = 5;
            const maxSize = 800;
            if (
              newBox.width < minSize ||
              newBox.height < minSize ||
              newBox.width > maxSize ||
              newBox.height > maxSize
            ) {
              return oldBox;
            }
            return newBox;
          }}
          enabledAnchors={shapeProps.type === 'text' ? ['middle-left', 'middle-right'] : undefined}
          borderStroke="#00ff00"
          borderDash={[2, 2]}
          padding={5}
        />
      )}
    </>
  );
}

// import { useRef, useEffect } from 'react';
// import { Line, Circle, Rect, Text, Transformer } from 'react-konva';
// import type { ShapeProps } from '@/screens/canvas';

// interface DraggableShapeProps extends ShapeProps {
//     isSelected: boolean;
//     onSelect: () => void;
//     onChange: (newAttrs: ShapeProps) => void;
// }

// export default function DraggableShape({ 
//     isSelected, 
//     onSelect, 
//     onChange, 
//     ...shapeProps 
// }: DraggableShapeProps) {
//     const shapeRef = useRef<any>(null);
//     const transformerRef = useRef<any>(null);

//     useEffect(() => {
//         if (isSelected && transformerRef.current && shapeRef.current) {
//             transformerRef.current.nodes([shapeRef.current]);
//             transformerRef.current.getLayer().batchDraw();
//         }
//     }, [isSelected]);

//     switch (shapeProps.type) {
//         case 'line':
//             return (
//                 <>
//                     <Line
//                         ref={shapeRef}
//                         points={shapeProps.points || []}
//                         stroke={shapeProps.strokeColor}
//                         strokeWidth={3}
//                         lineCap="round"
//                         lineJoin="round"
//                         tension={0.5}
//                         fill="transparent"
//                         draggable
//                         onClick={onSelect}
//                         onTap={onSelect}
//                         onDragEnd={(e) => {
//                             const node = e.target;
//                             // For lines, we need to update the points when dragging
//                             const dx = node.x();
//                             const dy = node.y();
//                             const newPoints = [...shapeProps.points!];
//                             // Update all points by the drag offset
//                             for (let i = 0; i < newPoints.length; i += 2) {
//                                 newPoints[i] += dx;
//                                 newPoints[i + 1] += dy;
//                             }
//                             onChange({
//                                 ...shapeProps,
//                                 points: newPoints,
//                                 x: 0, // Reset position after updating points
//                                 y: 0
//                             });
//                         }}
//                     />
//                     {isSelected && (
//                         <Transformer
//                             ref={transformerRef}
//                             resizeEnabled={false}
//                             borderStroke="#00ff00"
//                             borderDash={[2, 2]}
//                             anchorFill="#00ff00"
//                             anchorSize={8}
//                             enabledAnchors={['start-point', 'end-point']}
//                         />
//                     )}
//                 </>
//             );

//         case 'rectangle':
//             return (
//                 <>
//                     <Rect
//                         ref={shapeRef}
//                         x={shapeProps.x}
//                         y={shapeProps.y}
//                         width={shapeProps.width || 100}
//                         height={shapeProps.height || 100}
//                         stroke={shapeProps.strokeColor}
//                         strokeWidth={2}
//                         draggable
//                         onClick={onSelect}
//                         onTap={onSelect}
//                         onDragEnd={(e) => {
//                             onChange({
//                                 ...shapeProps,
//                                 x: e.target.x(),
//                                 y: e.target.y()
//                             });
//                         }}
//                         onTransformEnd={(e) => {
//                             const node = shapeRef.current;
//                             const scaleX = node.scaleX();
//                             const scaleY = node.scaleY();
//                             node.scaleX(1);
//                             node.scaleY(1);
//                             onChange({
//                                 ...shapeProps,
//                                 x: node.x(),
//                                 y: node.y(),
//                                 width: Math.max(5, node.width() * scaleX),
//                                 height: Math.max(5, node.height() * scaleY)
//                             });
//                         }}
//                     />
//                     {isSelected && (
//                         <Transformer
//                             ref={transformerRef}
//                             boundBoxFunc={(oldBox, newBox) => {
//                                 const minSize = 5;
//                                 const maxSize = 800;
//                                 return {
//                                     ...newBox,
//                                     width: Math.max(minSize, Math.min(maxSize, newBox.width)),
//                                     height: Math.max(minSize, Math.min(maxSize, newBox.height))
//                                 };
//                             }}
//                             borderStroke="#00ff00"
//                             borderDash={[2, 2]}
//                             anchorFill="#00ff00"
//                         />
//                     )}
//                 </>
//             );

//         case 'circle':
//             return (
//                 <>
//                     <Circle
//                         ref={shapeRef}
//                         x={shapeProps.x}
//                         y={shapeProps.y}
//                         radius={shapeProps.radius || 50}
//                         stroke={shapeProps.strokeColor}
//                         strokeWidth={2}
//                         draggable
//                         onClick={onSelect}
//                         onTap={onSelect}
//                         onDragEnd={(e) => {
//                             onChange({
//                                 ...shapeProps,
//                                 x: e.target.x(),
//                                 y: e.target.y()
//                             });
//                         }}
//                         onTransformEnd={(e) => {
//                             const node = shapeRef.current;
//                             const scaleX = node.scaleX();
//                             node.scaleX(1);
//                             node.scaleY(1);
//                             onChange({
//                                 ...shapeProps,
//                                 x: node.x(),
//                                 y: node.y(),
//                                 radius: Math.abs(node.radius() * scaleX)
//                             });
//                         }}
//                     />
//                     {isSelected && (
//                         <Transformer
//                             ref={transformerRef}
//                             boundBoxFunc={(oldBox, newBox) => {
//                                 const minSize = 5;
//                                 const maxSize = 800;
//                                 return {
//                                     ...newBox,
//                                     width: Math.max(minSize, Math.min(maxSize, newBox.width)),
//                                     height: Math.max(minSize, Math.min(maxSize, newBox.height))
//                                 };
//                             }}
//                             borderStroke="#00ff00"
//                             borderDash={[2, 2]}
//                             anchorFill="#00ff00"
//                         />
//                     )}
//                 </>
//             );

//         case 'text':
//             return (
//                 <>
//                     <Text
//                         ref={shapeRef}
//                         x={shapeProps.x}
//                         y={shapeProps.y}
//                         text={shapeProps.text || 'Double click to edit'}
//                         fontSize={16}
//                         fill={shapeProps.strokeColor}
//                         fontFamily="Arial"
//                         width={shapeProps.width || 200}
//                         height={shapeProps.height || 50}
//                         draggable
//                         onClick={onSelect}
//                         onTap={onSelect}
//                         onDblClick={() => {
//                             // Create editable text input
//                             const textNode = shapeRef.current;
//                             const textPosition = textNode.getAbsolutePosition();
                            
//                             const textarea = document.createElement('textarea');
//                             document.body.appendChild(textarea);
                            
//                             textarea.value = shapeProps.text || '';
//                             textarea.style.position = 'absolute';
//                             textarea.style.top = `${textPosition.y}px`;
//                             textarea.style.left = `${textPosition.x}px`;
//                             textarea.style.width = '200px';
//                             textarea.style.height = '50px';
//                             textarea.style.fontSize = '16px';
//                             textarea.style.color = shapeProps.strokeColor;
//                             textarea.style.background = 'rgba(0, 0, 0, 0.8)';
//                             textarea.style.border = '1px solid #00ff00';
//                             textarea.style.padding = '5px';
//                             textarea.style.outline = 'none';
//                             textarea.style.zIndex = '1000';
                            
//                             textarea.focus();
                            
//                             textarea.addEventListener('blur', () => {
//                                 onChange({
//                                     ...shapeProps,
//                                     text: textarea.value
//                                 });
//                                 document.body.removeChild(textarea);
//                             });
//                         }}
//                         // onDragEnd={(e) => {
//                         //     onChange({
//                         //         ...shapeProps,
//                         //         x: e.target.x(),
//                         //         y: e.target.y()
//                         //     });
//                         // }}
//                     />
//                     {isSelected && (
//                         <Transformer
//                             ref={transformerRef}
//                             enabledAnchors={['middle-left', 'middle-right']}
//                             boundBoxFunc={(oldBox, newBox) => {
//                                 newBox.width = Math.max(10, newBox.width);
//                                 return newBox;
//                             }}
//                             borderStroke="#00ff00"
//                             borderDash={[2, 2]}
//                             anchorFill="#00ff00"
//                             anchorSize={8}
//                         />
//                     )}
//                 </>
//             );

//         default:
//             return null;
//     }
// }