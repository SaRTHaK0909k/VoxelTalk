import React, { useEffect, useRef, useState, useCallback } from "react";
import { Eraser, Undo2, Redo2, Play } from "lucide-react";
import {SWATCHES} from "@/constants";
import { ColorSwatch, Group } from "@mantine/core";
import { Button } from "@/components/ui/button";
import axios from "axios";
import Toolbar from "@/components/ui/Toolbar";
import DraggableShape from "@/components/ui/DraggableShapes";

interface Response {
    expr: string;
    result: string;
    assign: boolean;
};

interface GeneratedResult {
    expression: string;
    answer: string;
};

export interface ShapeProps {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: number[];
  text?: string;
  strokeColor: string;
}

export default function Canvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState("rgb(255, 255, 255)");
    const [reset, setReset] = useState(false);
    const [result, setResult] = useState<GeneratedResult>()
    const [latexExpression, setLatexExpression] = useState<Array<string>>([]);
    const [latexPosition, setLatexPosition] = useState({x: 10, y: 200});
    const [dictOfVars, setDictOfVars] = useState({});

    const [canvasStates, setCanvasStates] = useState<ImageData[]>([]);
    const [currentStateIndex, setCurrentStateIndex] = useState(-1);
    
    const [positions, setPositions] = useState<{[key: number]: {x: number, y: number}}>({});
    const dragRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [currentDragId, setCurrentDragId] = useState<number | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const [activeTool, setActiveTool] = useState<string>('pen');
    const [shapes, setShapes] = useState<ShapeProps[]>([]);
    const [shapeStartPos, setShapeStartPos] = useState<{ x: number; y: number } | null>(null);

    const [selectedShape, setSelectedShape] = useState<string | null>(null);
    const [editingText, setEditingText] = useState<string | null>(null);
    const [resizing, setResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState<string | null>(null);

    const [draggingShape, setDraggingShape] = useState<string | null>(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleToolSelect = (tool: string) => {
        setActiveTool(tool);
    };

    // Add this function after isPointInResizeHandle
    const determineResizeHandle = (x: number, y: number, shape: ShapeProps): string => {
        const handleSize = 8;
        if (shape.type === 'circle') {
            const dx = x - shape.x;
            const dy = y - shape.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (Math.abs(distance - shape.radius!) < handleSize) {
                return 'edge';
            }
        } else if (shape.type === 'rectangle') {
            const isLeft = Math.abs(x - shape.x) < handleSize;
            const isRight = Math.abs(x - (shape.x + shape.width!)) < handleSize;
            const isTop = Math.abs(y - shape.y) < handleSize;
            const isBottom = Math.abs(y - (shape.y + shape.height!)) < handleSize;
            
            if (isLeft && isTop) return 'top-left';
            if (isRight && isTop) return 'top-right';
            if (isLeft && isBottom) return 'bottom-left';
            if (isRight && isBottom) return 'bottom-right';
        }
        return 'move';
    };

    // Add this function after isPointInShape
    const isPointInResizeHandle = (x: number, y: number, shape: ShapeProps): boolean => {
        const handleSize = 8; // Size of resize handles
        const handles = shape.type === 'circle' ? [
            { x: shape.x - shape.radius!, y: shape.y - shape.radius! },
            { x: shape.x + shape.radius!, y: shape.y + shape.radius! }
        ] : [
            { x: shape.x, y: shape.y }, // top-left
            { x: shape.x + shape.width!, y: shape.y }, // top-right
            { x: shape.x, y: shape.y + shape.height! }, // bottom-left
            { x: shape.x + shape.width!, y: shape.y + shape.height! } // bottom-right
        ];

        return handles.some(handle => 
            x >= handle.x - handleSize/2 && 
            x <= handle.x + handleSize/2 && 
            y >= handle.y - handleSize/2 && 
            y <= handle.y + handleSize/2
        );
    };

    // Add this function after handleShapeDragEnd
    const handleShapeResize = (shape: ShapeProps, x: number, y: number) => {
        switch (shape.type) {
            case 'rectangle':
                const width = x - shape.x;
                const height = y - shape.y;
                shape.width = Math.abs(width);
                shape.height = Math.abs(height);
                if (width < 0) shape.x = x;
                if (height < 0) shape.y = y;
                break;
                
            case 'circle':
                const dx = x - shape.x;
                const dy = y - shape.y;
                shape.radius = Math.sqrt(dx * dx + dy * dy);
                break;
                
            case 'line':
                if (shape.points) {
                    // Update end point for line
                    shape.points[2] = x;
                    shape.points[3] = y;
                }
                break;
                
            case 'text':
                // For text, only allow horizontal resizing
                const textWidth = Math.max(50, Math.abs(x - shape.x)); // Minimum width of 50px
                shape.width = textWidth;
                break;
        }
    };

    const drawResizeHandles = (ctx: CanvasRenderingContext2D, shape: ShapeProps) => {
        const handles = shape.type === 'circle' ? [
            { x: shape.x - shape.radius!, y: shape.y - shape.radius! },
            { x: shape.x + shape.radius!, y: shape.y + shape.radius! }
        ] : [
            { x: shape.x, y: shape.y }, // top-left
            { x: shape.x + shape.width!, y: shape.y }, // top-right
            { x: shape.x, y: shape.y + shape.height! }, // bottom-left
            { x: shape.x + shape.width!, y: shape.y + shape.height! } // bottom-right
        ];

        ctx.fillStyle = '#00ff00';
        handles.forEach(handle => {
            ctx.fillRect(handle.x - 4, handle.y - 4, 8, 8);
        });
    };

    const drawEndpointHandles = (ctx: CanvasRenderingContext2D, points: number[]) => {
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(points[0] - 4, points[1] - 4, 8, 8);
        ctx.fillRect(points[2] - 4, points[3] - 4, 8, 8);
    };

    const isPointInShape = (x: number, y: number, shape: ShapeProps): boolean => {
        switch (shape.type) {
            case 'rectangle':
                return x >= shape.x && x <= shape.x + shape.width! &&
                    y >= shape.y && y <= shape.y + shape.height!;
            case 'circle':
                const dx = x - shape.x;
                const dy = y - shape.y;
                return Math.sqrt(dx * dx + dy * dy) <= shape.radius!;
            case 'line':
                if (!shape.points) return false;
                const threshold = 5;
                const [x1, y1, x2, y2] = shape.points;
                const distance = pointToLineDistance(x, y, x1, y1, x2, y2);
                return distance <= threshold;
            case 'text':
                const metrics = document.createElement('canvas')
                    .getContext('2d')?.measureText(shape.text || '');
                const textWidth = metrics?.width || 0;
                return x >= shape.x && x <= shape.x + textWidth &&
                    y >= shape.y - 20 && y <= shape.y;
            default:
                return false;
        }
    };

    const pointToLineDistance = (x: number, y: number, x1: number, y1: number, x2: number, y2: number): number => {
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0)
            param = dot / lenSq;
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = x - xx;
        const dy = y - yy;
        
        return Math.sqrt(dx * dx + dy * dy);
    };

    const handleMouseDown = useCallback((e: React.MouseEvent, index: number) => {
        if (dragRef.current) {
            setIsDragging(true);
            setCurrentDragId(index);
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
        }
    }, []);

    const clampPosition = (x: number, y: number, width: number, height: number) => {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        return {
            x: Math.min(Math.max(x, 0), screenWidth - width),
            y: Math.min(Math.max(y, 0), screenHeight - height)
        };
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging && currentDragId !== null && dragRef.current) {
            const width = dragRef.current.offsetWidth;
            const height = dragRef.current.offsetHeight;
            
            const newPosition = clampPosition(
                e.clientX - dragOffset.x,
                e.clientY - dragOffset.y,
                width,
                height
            );
            
            setPositions(prev => ({
                ...prev,
                [currentDragId]: newPosition
            }));
        }
    }, [isDragging, currentDragId, dragOffset]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setCurrentDragId(null);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    useEffect(() => {
        const handleResize = () => {
            if (dragRef.current) {
                setPositions(prev => {
                    const newPositions = { ...prev };
                    Object.keys(newPositions).forEach(key => {
                        const pos = newPositions[Number(key)];
                        newPositions[Number(key)] = clampPosition(
                            pos.x,
                            pos.y,
                            dragRef.current!.offsetWidth,
                            dragRef.current!.offsetHeight
                        );
                    });
                    return newPositions;
                });
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleDelete = (indexToDelete: number) => {
        setLatexExpression(prev => prev.filter((_, index) => index !== indexToDelete));
        setPositions(prev => {
            const newPositions = { ...prev };
            delete newPositions[indexToDelete];
            // Reindex remaining positions
            return Object.keys(newPositions).reduce((acc, key) => {
                const newIndex = Number(key) > indexToDelete ? Number(key) - 1 : Number(key);
                acc[newIndex] = newPositions[Number(key)];
                return acc;
            }, {} as typeof newPositions);
        });
    };

    useEffect(() => {
        if (reset) {
            resetCanvas();
            setLatexExpression([]);
            setResult(undefined);
            setDictOfVars({});
            setReset(false);
        }
    }, [reset]);

    useEffect(() => {
        if (latexExpression.length > 0 && window.MathJax) {
            setTimeout(() => {
                window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
            }, 0);
        }
    }, [latexExpression]);

    useEffect(() => {
        if (result) {
            renderLatexToCanvas(result.expression, result.answer);
        }
    },[result])
    
    useEffect(() => {
        const canvas = canvasRef.current;

        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight - canvas.offsetTop;
                ctx.lineCap = "round";
                ctx.lineWidth = 3;

                // Save initial blank state
                const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
                setCanvasStates([initialState]);
                setCurrentStateIndex(0);
            }
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML';
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
            window.MathJax.Hub.Config({
                tex2jax: {inlineMath: [['$', '$'], ['\\(', '\\)']]},
            });
        };

        return () => {
            document.head.removeChild(script);
        }
    }, []);

    const renderLatexToCanvas = (expression: string, answer: string) => {
        const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;
        if (!latexExpression.includes(latex)) {
            setLatexExpression([...latexExpression, latex]);
            // Set initial position for new latex
            const initialPosition = clampPosition(
                latexPosition.x,
                latexPosition.y,
                0,  // We'll update this after render
                0   // We'll update this after render
            );

            setPositions(prev => ({
                ...prev,
                [latexExpression.length]: initialPosition
        }));
    }

        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    const sendData = async () => {
        const canvas = canvasRef.current;

        if (canvas) {
            try {
                console.log("Sending image data to server...");
                const imageData = canvas.toDataURL("image/png");
                console.log("Dict of vars:", dictOfVars);

                const response = await axios({
                    method: "post",
                    url: `${import.meta.env.VITE_API_URL}/calculate`,
                    data: {
                        image: imageData,
                        dict_of_vars: dictOfVars,
                    }
                });

                console.log("Raw response:", response);
                const resp = await response.data;
                console.log("Response: ", resp);

                if (response.data.data && response.data.data.length > 0) {
                const firstResult = response.data.data[0];
                setResult({
                    expression: firstResult.expr,
                    answer: firstResult.result
                });
                console.log("Result set:", {
                    expression: firstResult.expr,
                    answer: firstResult.result
                });

                resp.data.forEach((data: Response) => {
                    if (data.assign === true) {
                        setDictOfVars({
                            ...dictOfVars,
                            [data.expr]: data.result
                        });
                    }
                });

                const ctx = canvas.getContext("2d");
                const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
                let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 9;

                for (let y = 0; y < canvas.height; y++) {
                    for (let x = 0; x < canvas.width; x++) {
                        const i = (y * canvas.width + x) * 4;
                        if (imageData.data[i + 3] > 0) {
                            minX = Math.min(minX, x);
                            minY = Math.min(minY, y);
                            maxX = Math.max(maxX, x);
                            maxY = Math.max(maxY, y);
                        }
                    }
                }

                const centerX = (minX + maxX) / 2;
                const centerY = (minY + maxY) / 2;

                setLatexPosition({ x: centerX, y: centerY });

                // resp.data.forEach((data: Response) => {
                //     setTimeout(() => {
                //         setResult({
                //             expression: data.expr,
                //             answer: data.result
                //         });
                //     }, 1000);
                // });

                if (resp.data[0]) {
                    setResult({
                        expression: resp.data[0].expr,
                        answer: resp.data[0].result
                    });
                }

            }
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    console.error("Axios error:", error.response?.data || error.message);
                } else {
                    console.error("Error sending data:", error);
                }
            }
        }
    }

    const resetCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Save cleared state
                const clearedState = ctx.getImageData(0, 0, canvas.width, canvas.height);
                setCanvasStates([clearedState]);
                setCurrentStateIndex(0);
            }
        }
    };

    const saveState = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
                // Get current canvas state
                const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
                
                // Remove any states after current index
                const newStates = canvasStates.slice(0, currentStateIndex + 1);

                const newShapesState = JSON.stringify(shapes);
                
                // Add new state
                setCanvasStates([...newStates, currentState]);
                setCurrentStateIndex(currentStateIndex + 1);

                localStorage.setItem(`shapes_${currentStateIndex + 1}`, newShapesState);
            }
        }
    };

    const undo = () => {
        if (currentStateIndex > 0) {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    const newIndex = currentStateIndex - 1;
                    ctx.putImageData(canvasStates[newIndex], 0, 0);
                    setCurrentStateIndex(newIndex);

                    const savedShapes = localStorage.getItem(`shapes_${newIndex}`);
                    if (savedShapes) {
                        setShapes(JSON.parse(savedShapes));
                    }
                }
            }
        }
    };

    const redo = () => {
        if (currentStateIndex < canvasStates.length - 1) {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    const newIndex = currentStateIndex + 1;
                    ctx.putImageData(canvasStates[newIndex], 0, 0);
                    setCurrentStateIndex(newIndex);

                    const savedShapes = localStorage.getItem(`shapes_${newIndex}`);
                    if (savedShapes) {
                        setShapes(JSON.parse(savedShapes));
                    }
                }
            }
        }
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (activeTool === 'pen') {
            canvas.style.background = "black";
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                setIsDrawing(true);
            }
        } else if (activeTool === 'select') { // Add this condition
            const clickedShape = shapes.find(shape => isPointInShape(x, y, shape));
            if (!clickedShape) {
                setSelectedShape(null);
                setResizing(false);
                setResizeHandle(null);
                drawShapes(shapes); // Redraw without selection indicators
                return;
            }

            // Handle shape selection
            setSelectedShape(clickedShape.id);
            if (isPointInResizeHandle(x, y, clickedShape)) {
                setResizing(true);
                setResizeHandle(determineResizeHandle(x, y, clickedShape));
                setShapeStartPos({ x, y });
            } else {
                setResizing(false);
                setResizeHandle(null);
                setShapeStartPos({ x: x - clickedShape.x, y: y - clickedShape.y });
            }
            drawShapes(shapes); // Redraw with selection indicators
        } else {
            // For drawing new shapes
            setSelectedShape(null);
            setResizing(false);
            setResizeHandle(null);
            setShapeStartPos({ x, y });
            setIsDrawing(true);
            drawShapes(shapes); 
        }
    };

    const stopDrawing = (e?: React.MouseEvent<HTMLCanvasElement>) => {
        if (resizing) {
            setResizing(false);
            setResizeHandle(null);
            saveState();
        }
        if (isDrawing) {
            if (activeTool === 'pen') {
                saveState();
            } else if (shapeStartPos && canvasRef.current) {
                const canvas = canvasRef.current;
                const rect = canvas.getBoundingClientRect();
                const x = e ? e.clientX - rect.left : shapeStartPos.x;
                const y = e ? e.clientY - rect.top : shapeStartPos.y;

                const newShape: ShapeProps = {
                    id: Date.now().toString(),
                    type: activeTool,
                    x: shapeStartPos.x,
                    y: shapeStartPos.y,
                    strokeColor: color
                };

                switch (activeTool) {
                    case 'rectangle':
                        newShape.width = x - shapeStartPos.x;
                        newShape.height = y - shapeStartPos.y;
                        break;
                    case 'circle':
                        const radius = Math.sqrt(
                            Math.pow(x - shapeStartPos.x, 2) + Math.pow(y - shapeStartPos.y, 2)
                        );
                        newShape.radius = radius;
                        break;
                    case 'line':
                        newShape.points = [shapeStartPos.x, shapeStartPos.y, x, y];
                        break;
                    case 'text':
                        newShape.text = 'Double click to edit';
                        newShape.width = 100; // Default width
                        newShape.height = 20; // Default height
                        setShapes([...shapes, newShape]);
                        setSelectedShape(newShape.id); // Auto-select new text box
                        saveState();
                        break;
                }

                setShapes([...shapes, newShape]);
                drawShapes([...shapes, newShape]);
                saveState();
            }
        }
        setIsDrawing(false);
        setShapeStartPos(null);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (activeTool === 'pen' && isDrawing) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.strokeStyle = color;
                ctx.lineTo(x, y);
                ctx.stroke();
            }
        } else if (selectedShape && shapeStartPos) {
        // Handle dragging
            const shape = shapes.find(s => s.id === selectedShape);
            if (shape) {
                const updatedShape = { ...shape };
                if (resizing) {
                    // Handle resizing based on shape type
                    const handle = resizeHandle || 'move';
                    switch (handle) {
                        case 'top-left':
                            if (shape.type === 'rectangle') {
                                const width = shape.x + shape.width! - x;
                                const height = shape.y + shape.height! - y;
                                updatedShape.x = x;
                                updatedShape.y = y;
                                updatedShape.width = Math.max(5, width);
                                updatedShape.height = Math.max(5, height);
                            }
                            break;
                        case 'top-right':
                            if (shape.type === 'rectangle') {
                                const width = x - shape.x;
                                const height = shape.y + shape.height! - y;
                                updatedShape.y = y;
                                updatedShape.width = Math.max(5, width);
                                updatedShape.height = Math.max(5, height);
                            }
                            break;
                        case 'bottom-left':
                            if (shape.type === 'rectangle') {
                                const width = shape.x + shape.width! - x;
                                const height = y - shape.y;
                                updatedShape.x = x;
                                updatedShape.width = Math.max(5, width);
                                updatedShape.height = Math.max(5, height);
                            }
                            break;
                        case 'bottom-right':
                            if (shape.type === 'rectangle') {
                                updatedShape.width = Math.max(5, x - shape.x);
                                updatedShape.height = Math.max(5, y - shape.y);
                            }
                            break;
                        case 'edge':
                            if (shape.type === 'circle') {
                                const dx = x - shape.x;
                                const dy = y - shape.y;
                                updatedShape.radius = Math.max(5, Math.sqrt(dx * dx + dy * dy));
                            }
                            break;
                        default:
                            handleShapeResize(updatedShape, x, y);
                            break;
                    }
                } else {
                    // Handle dragging
                    updatedShape.x = x - shapeStartPos.x;
                    updatedShape.y = y - shapeStartPos.y;
                }
                setShapes(shapes.map(s => s.id === selectedShape ? updatedShape : s));
                drawShapes(shapes);
            }
        } else if (isDrawing && shapeStartPos) {
            // Create temporary shape while dragging
            const newShape: ShapeProps = {
                id: Date.now().toString(),
                type: activeTool,
                x: shapeStartPos.x,
                y: shapeStartPos.y,
                strokeColor: color
            };

            switch (activeTool) {
                case 'rectangle':
                    newShape.width = x - shapeStartPos.x;
                    newShape.height = y - shapeStartPos.y;
                    break;
                case 'circle':
                    const radius = Math.sqrt(
                        Math.pow(x - shapeStartPos.x, 2) + Math.pow(y - shapeStartPos.y, 2)
                    );
                    newShape.radius = radius;
                    break;
                case 'line':
                    newShape.points = [shapeStartPos.x, shapeStartPos.y, x, y];
                    break;
            }

            // Redraw all shapes including the temporary one
            drawShapes([...shapes, newShape]);
        }
    };

    const drawShapes = (shapesToDraw: ShapeProps[]) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Redraw all shapes
        shapesToDraw.forEach(shape => {
            ctx.strokeStyle = shape.strokeColor;
            ctx.beginPath();

            switch (shape.type) {
                case 'rectangle':
                    if (shape.width && shape.height) {
                        ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
                        
                        // Draw selection if selected
                        if (selectedShape === shape.id) {
                            ctx.setLineDash([5, 5]);
                            ctx.strokeStyle = '#00ff00';
                            ctx.strokeRect(
                                shape.x - 2,
                                shape.y - 2,
                                shape.width! + 4,
                                shape.height! + 4
                            );
                            ctx.setLineDash([]);
                            
                            // Draw resize handles
                            drawResizeHandles(ctx, shape);
                        }
                    }
                    break;
                case 'circle':
                    if (shape.radius) {
                        ctx.beginPath();
                        ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
                        ctx.stroke();
                        
                        if (selectedShape === shape.id) {
                            ctx.setLineDash([5, 5]);
                            ctx.strokeStyle = '#00ff00';
                            ctx.beginPath();
                            ctx.arc(shape.x, shape.y, shape.radius + 2, 0, Math.PI * 2);
                            ctx.stroke();
                            ctx.setLineDash([]);
                            
                            drawResizeHandles(ctx, shape);
                        }
                    }
                    break;
                case 'line':
                    if (shape.points) {
                        ctx.beginPath();
                        ctx.moveTo(shape.points[0], shape.points[1]);
                        ctx.lineTo(shape.points[2], shape.points[3]);
                        ctx.stroke();
                        
                        if (selectedShape === shape.id) {
                            ctx.setLineDash([5, 5]);
                            ctx.strokeStyle = '#00ff00';
                            ctx.beginPath();
                            ctx.moveTo(shape.points[0], shape.points[1]);
                            ctx.lineTo(shape.points[2], shape.points[3]);
                            ctx.stroke();
                            ctx.setLineDash([]);
                            
                            drawEndpointHandles(ctx, shape.points);
                        }
                    }
                    break;
                case 'text':
                    if (shape.text) {
                        ctx.font = '16px Arial';
                        ctx.fillStyle = shape.strokeColor;
                        ctx.fillText(shape.text, shape.x, shape.y);
                        
                        if (selectedShape === shape.id) {
                            const metrics = ctx.measureText(shape.text);
                            const height = 20; // Approximate text height
                            
                            ctx.setLineDash([5, 5]);
                            ctx.strokeStyle = '#00ff00';
                            ctx.strokeRect(
                                shape.x - 2,
                                shape.y - height + 2,
                                metrics.width + 4,
                                height + 4
                            );
                            ctx.setLineDash([]);
                        }
                    }
                    break;
            }
        });
    };
    return (
        <>
            <div className="flex items-center z-20 gap-4 p-4">
                <div className="flex gap-2">
                    <Button
                        onClick={() => setReset(true)}
                        className="z-20 bg-black text-white border border-gray-600"
                        variant="default"
                        color="black"
                    >
                        <Eraser className="w-4 h-4" />
                        Reset Canvas
                    </Button>

                    <Button
                        onClick={undo}
                        className="z-20 bg-black text-white border border-gray-600"
                        variant="default"
                        color="black"
                        disabled={currentStateIndex <= 0}
                    >
                        <Undo2 className="w-4 h-4" />
                        Undo
                    </Button>

                    <Button
                        onClick={redo}
                        className="z-20 bg-black text-white border border-gray-600"
                        variant="default"
                        color="black"
                        disabled={currentStateIndex >= canvasStates.length - 1}
                    >
                        <Redo2 className="w-4 h-4" />
                        Redo
                    </Button>
                </div>
                
                <div className="flex-1 z-20">
                    <Group className="z-20 flex justify-center gap-2">
                        {SWATCHES.map((swatch) => (
                            <ColorSwatch
                                key={swatch}
                                color={swatch}
                                onClick={() => setColor(swatch)}
                            />
                        ))}
                    </Group>
                </div>
                
                <div className="z-20">
                    <Button
                        onClick={sendData}
                        className="z-20 bg-black text-white border border-gray-600"
                        variant="default"
                        color="black"
                    >
                        <Play className="w-4 h-4" />
                        Solve
                    </Button>
                </div>

            </div>

            <Toolbar activeTool={activeTool} onToolSelect={handleToolSelect} />
            
            <canvas
                ref={canvasRef}
                id="canvas"
                className="absolute top-0 left-0 w-full h-full bg-black"
                onMouseDown={startDrawing}
                onMouseOut={stopDrawing}
                onMouseUp={stopDrawing}
                onMouseMove={draw}
            />

            {latexExpression && latexExpression.map((latex, index) => {
                const position = positions[index] || latexPosition;
                return (
                    <div
                        key={index}
                        ref={dragRef}
                        className="absolute text-white cursor-move max-w-[90vw]"
                        style={{
                            left: position.x,
                            top: position.y,
                            userSelect: 'none',
                            zIndex: currentDragId === index ? 1000 : 1
                        }}
                        onMouseDown={(e) => handleMouseDown(e, index)}
                    >
                        <div className="latex-content whitespace-nowrap">{latex}</div>
                    </div>
                );
            })}
        </>
    )
}


// import { useEffect, useRef, useState } from "react";
// import { Stage, Layer, Text } from "react-konva";
// import { Eraser, Undo2, Redo2, Play } from "lucide-react";
// import { SWATCHES } from "@/constants";
// import { ColorSwatch, Group } from "@mantine/core";
// import { Button } from "@/components/ui/button";
// import axios from "axios";
// import Toolbar from "@/components/ui/Toolbar";
// import DraggableShape from "@/components/ui/DraggableShapes";

// interface Response {
//     expr: string;
//     result: string;
//     assign: boolean;
// }

// interface GeneratedResult {
//     expression: string;
//     answer: string;
// }

// export interface ShapeProps {
//     id: string;
//     type: string;
//     x: number;
//     y: number;
//     width?: number;
//     height?: number;
//     radius?: number;
//     points?: number[];
//     text?: string;
//     strokeColor: string;
// }

// interface LatexProps {
//     id: string;
//     text: string;
//     x: number;
//     y: number;
// }

// export default function Canvas() {
//     const stageRef = useRef<any>(null);
//     const [color, setColor] = useState("rgb(255, 255, 255)");
//     const [activeTool, setActiveTool] = useState('select');
//     const [shapes, setShapes] = useState<ShapeProps[]>([]);
//     const [selectedId, setSelectedId] = useState<string | null>(null);
//     const [latexExpressions, setLatexExpressions] = useState<LatexProps[]>([]);
//     const [history, setHistory] = useState<ShapeProps[][]>([[]]);
//     const [historyStep, setHistoryStep] = useState(0);
//     const [dictOfVars, setDictOfVars] = useState({});

//     // Drawing state
//     const isDrawing = useRef(false);
//     const lastLine = useRef<number[]>([]);

//     const handleToolSelect = (tool: string) => {
//         setActiveTool(tool);
//     };

//     const handleMouseDown = (e: any) => {
//         const pos = e.target.getStage().getPointerPosition();
//         isDrawing.current = true;
//         lastLine.current = [pos.x, pos.y];

//         if (activeTool === 'select') {
//             const clickedOnEmpty = e.target === e.target.getStage();
//             if (clickedOnEmpty) {
//                 setSelectedId(null);
//             }
//             return;
//         }

//         if (activeTool === 'line') {
//             // For lines, create initial shape with start and end at same point
//             const newShape: ShapeProps = {
//                 id: Date.now().toString(),
//                 type: 'line',
//                 x: pos.x,
//                 y: pos.y,
//                 points: [pos.x, pos.y, pos.x, pos.y], // Start and end points
//                 strokeColor: color
//             };
//             setShapes([...shapes, newShape]);
//             setSelectedId(newShape.id);
//             return;
//         }

//         const newShape: ShapeProps = {
//             id: Date.now().toString(),
//             type: activeTool,
//             x: pos.x,
//             y: pos.y,
//             strokeColor: color,
//             // Add default values for each type
//             ...(activeTool === 'text' && {
//                 text: 'Double click to edit',
//                 width: 200,
//                 height: 50
//             }),
//             ...(activeTool === 'rectangle' && {
//                 width: 100,
//                 height: 100
//             }),
//             ...(activeTool === 'circle' && {
//                 radius: 50
//             })
//         };

//         setShapes([...shapes, newShape]);
//     };

//     const handleMouseMove = (e: any) => {
//         if (!isDrawing.current) return;

//         const stage = e.target.getStage();
//         const point = stage.getPointerPosition();

//         if (activeTool === 'line') {
//             const lastShape = shapes[shapes.length - 1];
//             if (lastShape && lastShape.type === 'line') {
//                 // Update only the end point of the line
//                 const newPoints = [
//                     lastShape.points![0],  // Keep start x
//                     lastShape.points![1],  // Keep start y
//                     point.x,              // Update end x
//                     point.y               // Update end y
//                 ];
                
//                 const updatedShape = {
//                     ...lastShape,
//                     points: newPoints
//                 };

//                 setShapes(shapes.map(shape => 
//                     shape.id === lastShape.id ? updatedShape : shape
//                 ));
//             }
//             return;
//         }

//         if (activeTool === 'pen') {
//             const newShape: ShapeProps = {
//                 id: Date.now().toString(),
//                 type: 'line',
//                 x: lastLine.current[0], 
//                 y: lastLine.current[1], 
//                 points: [...lastLine.current, point.x, point.y],
//                 strokeColor: color
//             };
//             setShapes(prevShapes => [...prevShapes, newShape]);
//             lastLine.current = [point.x, point.y];
//         }
//     };

//     const handleMouseUp = () => {
//         isDrawing.current = false;
//         const newHistory = history.slice(0, historyStep + 1);
//         newHistory.push(shapes);
//         setHistory(newHistory);
//         setHistoryStep(historyStep + 1);
//     };

//     const handleShapeChange = (updatedShape: ShapeProps) => {
//         const newShapes = shapes.map(shape => 
//             shape.id === updatedShape.id ? updatedShape : shape
//         );
//         setShapes(newShapes);

//         // Add to history
//         const newHistory = history.slice(0, historyStep + 1);
//         newHistory.push(newShapes);
//         setHistory(newHistory);
//         setHistoryStep(historyStep + 1);
//     };

//     const undo = () => {
//         if (historyStep === 0) return;
//         setHistoryStep(historyStep - 1);
//         setShapes(history[historyStep - 1]);
//     };

//     const redo = () => {
//         if (historyStep === history.length - 1) return;
//         setHistoryStep(historyStep + 1);
//         setShapes(history[historyStep + 1]);
//     };

//     const reset = () => {
//         setShapes([]);
//         setLatexExpressions([]);
//         setHistory([[]]);
//         setHistoryStep(0);
//         setDictOfVars({});
//     };

//     const sendData = async () => {
//         if (stageRef.current) {
//             try {
//                 const stage = stageRef.current;
//                 const dataURL = stage.toDataURL();

//                 const response = await axios({
//                     method: "post",
//                     url: `${import.meta.env.VITE_API_URL}/calculate`,
//                     data: {
//                         image: dataURL,
//                         dict_of_vars: dictOfVars,
//                     }
//                 });

//                 if (response.data.data && response.data.data.length > 0) {
//                     response.data.data.forEach((data: Response) => {
//                         if (data.assign) {
//                             setDictOfVars(prev => ({
//                                 ...prev,
//                                 [data.expr]: data.result
//                             }));
//                         }
                        

//                         // Create LaTeX expression
//                         const latex: LatexProps = {
//                             id: Date.now().toString(),
//                             text: `\${data.expr} = ${data.result}}\)`,
//                             x: stage.width() / 2,
//                             y: stage.height() / 2
//                         };
                        
//                         setLatexExpressions(prev => [...prev, latex]);
//                     });

//                     // Trigger MathJax rendering
//                     setTimeout(() => {
//                         if (window.MathJax) {
//                             window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
//                         }
//                     }, 0);
//                 }
//             } catch (error) {
//                 console.error("Error sending data:", error);
//             }
//         }
//     };

//     // MathJax setup
//     useEffect(() => {
//         const script = document.createElement('script');
//         script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML';
//         script.async = true;
//         document.head.appendChild(script);

//         script.onload = () => {
//             window.MathJax.Hub.Config({
//                 tex2jax: {inlineMath: [['$', '$'], ['\\(', '\\)']]}
//             });
//         };

//         return () => {
//             document.head.removeChild(script);
//         };
//     }, []);

//     return (
//         <div className="relative w-screen h-screen bg-black">
//             {/* Top Toolbar */}
//             <div className="absolute top-0 left-0 right-0 flex items-center z-20 gap-4 p-4">
//                 <div className="flex gap-2">
//                     <Button onClick={reset} className="bg-black text-white border border-gray-600">
//                         <Eraser className="w-4 h-4" />
//                         Reset
//                     </Button>
//                     <Button 
//                         onClick={undo} 
//                         className="bg-black text-white border border-gray-600"
//                         disabled={historyStep === 0}
//                     >
//                         <Undo2 className="w-4 h-4" />
//                         Undo
//                     </Button>
//                     <Button 
//                         onClick={redo}
//                         className="bg-black text-white border border-gray-600"
//                         disabled={historyStep === history.length - 1}
//                     >
//                         <Redo2 className="w-4 h-4" />
//                         Redo
//                     </Button>
//                 </div>
                
//                 <div className="flex-1">
//                     <Group className="flex justify-center gap-2">
//                         {SWATCHES.map((swatch) => (
//                             <ColorSwatch
//                                 key={swatch}
//                                 color={swatch}
//                                 onClick={() => setColor(swatch)}
//                             />
//                         ))}
//                     </Group>
//                 </div>
                
//                 <Button
//                     onClick={sendData}
//                     className="bg-black text-white border border-gray-600"
//                 >
//                     <Play className="w-4 h-4" />
//                     Solve
//                 </Button>
//             </div>

//             {/* Left Toolbar */}
//             <Toolbar activeTool={activeTool} onToolSelect={handleToolSelect} />

//             {/* Konva Stage */}
//             <Stage
//                 ref={stageRef}
//                 width={window.innerWidth}
//                 height={window.innerHeight}
//                 onMouseDown={handleMouseDown}
//                 onMouseMove={handleMouseMove}
//                 onMouseUp={handleMouseUp}
//                 className="bg-black"
//             >
//                 <Layer>
//                     {shapes.map((shape) => (
//                         <DraggableShape
//                             key={shape.id}
//                             {...shape}
//                             isSelected={shape.id === selectedId}
//                             onSelect={() => setSelectedId(shape.id)}
//                             onChange={handleShapeChange}
//                         />
//                     ))}
//                     {latexExpressions.map((latex) => (
//                         <Text
//                             key={latex.id}
//                             text={latex.text}
//                             x={latex.x}
//                             y={latex.y}
//                             fill={color}
//                             fontSize={30}
//                             fontFamily="'Latin Modern Math', 'STIX Math', 'Cambria Math', serif"  // math fonts fallback
//                             draggable
//                             onDragEnd={(e) => {
//                                 const newLatex = {
//                                     ...latex,
//                                     x: e.target.x(),
//                                     y: e.target.y()
//                                 };
//                                 setLatexExpressions(prev =>
//                                     prev.map(l => l.id === latex.id ? newLatex : l)
//                                 );
//                             }}
//                         />
//                     ))}
//                 </Layer>
//             </Stage>
//         </div>
//     );
// }