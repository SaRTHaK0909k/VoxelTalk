import React, {useEffect, useLayoutEffect, useRef, useState} from 'react'
import rough from "roughjs"
import type { Drawable } from 'roughjs/bin/core';
import getStroke from "perfect-freehand"
import axios from 'axios';
import Draggable from 'react-draggable';
import { Button } from '@/components/ui/button';

import Toolbar from '@/components/ui/Toolbar'; 
import { DotBackground } from '@/components/ui/DotBackground';
import { Loader2, Redo2, Sparkles, Trash2Icon, Undo2 } from 'lucide-react';
import { ShimmerButton } from '@/components/ui/ShimmerButton';
import { FamilyButton } from '@/components/ui/FamilyButton';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';



interface GeneratedResult {
  expression: string;
  answer: string;
}

interface ResponseData {
  expr: string;
  result: string;
  assign: boolean;
}

const generator = rough.generator();

type Point = {
  x: number;
  y: number;
};

type DrawingElement = {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: string;
  roughElement?: Drawable;
  points?: Point[];
  text?: string;
  color?: string;
};

type SelectedElement = DrawingElement & {
  offsetX: number;
  offsetY: number;
  position: string | null;
  xOffsets?: number[]; // For pencil tool
  yOffsets?: number[];
};


function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function createElement(id: number, x1: number, y1: number, x2: number, y2: number, type: string, color: string) : DrawingElement {
    switch(type) {
      case "line":
      case "rectangle":
      case "circle":
        const roughElement = type === "line" 
          ? generator.line(x1, y1, x2, y2, { stroke: color })
          : type === "rectangle"
          ? generator.rectangle(x1, y1, x2 - x1, y2 - y1, { stroke: color })
          : generator.ellipse(
              (x1 + x2) / 2, // centerX
              (y1 + y2) / 2, // centerY
              Math.abs(x2 - x1), // width
              Math.abs(y2 - y1), // height
              { stroke: color }
            );
        return {id, x1, y1, x2, y2, type, roughElement, color};
      case "pencil":
        return {id, type, points: [{x: x1, y: y1}], x1, y1, x2: x1, y2: y1, color};
      case "text":
        return {id, type, x1, y1, x2, y2, text: "", color}
      default: 
        throw new Error('Type not recognised: ${type}');
    }
  
};

const adjustElementCoordinates = (element: DrawingElement) => {
  const {type, x1, y1, x2, y2} = element;
  if (type === "rectangle" || type === "circle") {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    return {x1: minX, y1: minY, x2: maxX, y2: maxY};
  } else {
    if (x1 < x2 || (x1 === x2 && y1 < y2)) {
      return {x1, y1, x2, y2};
    } else {
      return {x1: x2, y1: y2, x2: x1, y2: y1};
    }
  }
};

const nearPoint = (x: number, y: number, x1: number, y1: number, name: string) => {
  return Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5 ? name : null;
}

const onLine = (x1: number, y1: number, x2: number, y2: number, x: number, y: number, maxDistance = 1) => {
  const a = {x: x1, y: y1};
  const b = {x: x2, y: y2};
  const c = {x, y};
  const offset = distance(a, b) - (distance(a, c) + distance(b, c));
  return Math.abs(offset) < maxDistance ? "inside" : null;
}

const positionWithinElement = (x: number, y: number, element: DrawingElement) => {
  const {type, x1, x2, y1, y2} = element;
  switch(type) {
    case "rectangle": 
      const topLeft = nearPoint(x, y, x1, y1, "tl");

      const topRight = nearPoint(x, y, x2, y1, "tr");

      const bottomLeft = nearPoint(x, y, x1, y2, "bl");

      const bottomRight = nearPoint(x, y, x2, y2, "br");

      const on =  x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;
      return topLeft || topRight || bottomLeft || bottomRight || on;
    case "line":
      const inside = onLine(x1, y1, x2, y2, x, y);
      const start = nearPoint(x, y, x1, y1, "start");
      const end = nearPoint(x, y, x2, y2, "end");
      
      return start || end || inside;
    case "circle":
      const centerX = (x1 + x2) / 2;
      const centerY = (y1 + y2) / 2;
      const radiusX = Math.abs(x2 - x1) / 2;
      const radiusY = Math.abs(y2 - y1) / 2;
      
      // Check if inside ellipse using ellipse equation
      const dx = x - centerX;
      const dy = y - centerY;
      const ins = (dx * dx) / (radiusX * radiusX) + (dy * dy) / (radiusY * radiusY) <= 1 ? "inside" : null;

      const tolerance = 10; // Increased tolerance for easier grabbing

      // Top-left quadrant (relative to center)
      if (x <= centerX && y <= centerY) {
        const angle = Math.atan2(centerY - y, centerX - x);
        const ellipseX = centerX - radiusX * Math.cos(angle);
        const ellipseY = centerY - radiusY * Math.sin(angle);
        if (distance({ x, y }, { x: ellipseX, y: ellipseY }) < tolerance) return "tl";
      }
      // Top-right quadrant
      if (x >= centerX && y <= centerY) {
        const angle = Math.atan2(centerY - y, x - centerX);
        const ellipseX = centerX + radiusX * Math.cos(angle);
        const ellipseY = centerY - radiusY * Math.sin(angle);
        if (distance({ x, y }, { x: ellipseX, y: ellipseY }) < tolerance) return "tr";
      }
      // Bottom-left quadrant
      if (x <= centerX && y >= centerY) {
        const angle = Math.atan2(y - centerY, centerX - x);
        const ellipseX = centerX - radiusX * Math.cos(angle);
        const ellipseY = centerY + radiusY * Math.sin(angle);
        if (distance({ x, y }, { x: ellipseX, y: ellipseY }) < tolerance) return "bl";
      }
      // Bottom-right quadrant
      if (x >= centerX && y >= centerY) {
        const angle = Math.atan2(y - centerY, x - centerX);
        const ellipseX = centerX + radiusX * Math.cos(angle);
        const ellipseY = centerY + radiusY * Math.sin(angle);
        if (distance({ x, y }, { x: ellipseX, y: ellipseY }) < tolerance) return "br";
      }

      return ins; 
    case "pencil":
      const betweenAnyPoint = element.points!.some((point, index) => {
        const nextPoint = element.points![index + 1];
        if (!nextPoint)
          return false;
        return onLine(point.x, point.y, nextPoint.x, nextPoint.y, x, y, 5) != null;
      })
      return betweenAnyPoint ? "inside" : null;
    case "text":
      return x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null;
    default:
      throw new Error(`Type not recognized: ${type}`);
  }
};

const getElementAtPosition = (x: number, y: number, elements: DrawingElement[]) => {
  return elements
    .map(element => ({...element, position: positionWithinElement(x, y, element)}))
    .find(element => element.position !== null);
};

const cursorForPosition = (position: string | null) => {
  switch (position) {
    case "tl":
    case "br":
    case "start":
    case "end":
      return "nwse-resize";
    case "tr":
    case "bl":
      return "nesw-resize";
    default:
      return "move";
  }
};

const resizedCoordinates = (
  clientX: number,
  clientY: number,
  position: string,
  coordinates: { x1: number; y1: number; x2: number; y2: number },
  elementType?: string 
): { x1: number; y1: number; x2: number; y2: number } => {
  const { x1, y1, x2, y2 } = coordinates;

  if (elementType === "circle") {
    let newX1 = x1, newY1 = y1, newX2 = x2, newY2 = y2;

    switch (position) {
    case "tl":
      newX1 = clientX;
      newY1 = clientY;
      break;
    case "tr":
      newX2 = clientX;
      newY1 = clientY;
      break;
    case "bl":
      newX1 = clientX;
      newY2 = clientY;
      break;
    case "br":
      newX2 = clientX;
      newY2 = clientY;
      break;
    default:
      break;
    }
    return { x1: newX1, y1: newY1, x2: newX2, y2: newY2 };
  }

  switch (position) {
    case "start":
    case "tl":
      return { x1: clientX, y1: clientY, x2, y2 };
    case "tr":
      return { x1, y1: clientY, x2: clientX, y2 };
    case "bl":
      return { x1: clientX, y1, x2, y2: clientY };
    case "br":
    case "end":
      return { x1, y1, x2: clientX, y2: clientY };
    default:
      return { x1, y1, x2, y2 };
  }
};

type UseHistoryReturn = [
  DrawingElement[], 
  (action: DrawingElement[] | ((prev: DrawingElement[]) => DrawingElement[]), overwrite?: boolean) => void,
  () => void,
  () => void
];

const useHistory = (initialState: DrawingElement[]): UseHistoryReturn => {
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<DrawingElement[][]>([initialState]);

  const setState = (action: DrawingElement[] | ((prev: DrawingElement[]) => DrawingElement[]), overwrite = false) => {
    const newState = typeof action === "function" ? action(history[index]) : action;
    if (overwrite) {
      const historyCopy = [...history];
      historyCopy[index] = newState;
      setHistory(historyCopy);
    } else {
      const updatedState = [...history].slice(0, index + 1);
      setHistory([...updatedState, newState]);
      setIndex(prevState => prevState + 1);
    }
  }

  const undo = () => {
    index > 0 && setIndex(prevState => prevState - 1);
  }

  const redo = () => {
    index < history.length - 1 && setIndex(prevState => prevState + 1);
  }

  return [history[index], setState, undo, redo];
};

const getSvgPathFromStroke = (stroke: number[][]): string => {
  if (!stroke.length) return ""

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  )

  d.push("Z")
  return d.join(' ')
}

const drawElement = (roughCanvas: any, context: CanvasRenderingContext2D, element: DrawingElement)  => {
  switch(element.type) {
      case "line":
      case "rectangle":
      case "circle":
        if (element.roughElement) {
          roughCanvas.draw(element.roughElement);
        }
        break;
      case "pencil":
        if (element.points && element.points.length > 0) {
          const stroke = getSvgPathFromStroke(getStroke(element.points, {
            size: 8,
            thinning: 0.5,
            smoothing: 0.5,
            streamline: 0.5,
            easing: (t) => t,
            simulatePressure: true,
            last: true,
            start: {
              cap: true,
              taper: 0,
              easing: (t) => t,
            },
            end: {
              cap: true,
              taper: 0,
              easing: (t) => t,
            },
          }));
          context.fillStyle = element.color || "black";
          context.fill(new Path2D(stroke));
        }
        break;
      case "text":
        context.textBaseline = "top";
        context.font = '24px sans-serif';
        context.fillText(element.text || "", element.x1, element.y1);
        context.fillStyle = element.color || "black";
        const lines = (element.text || "").split('\n');
        lines.forEach((line, index) => {
          context.fillText(line, element.x1, element.y1 + index * 24); // Assuming 24px line height
        });
        break;
      default: 
        throw new Error(`Type not recognised: ${element.type}`);
  }
};

const adjustmentRequired = (type: string) => ["line", "rectangle", "circle"].includes(type);

function Test() {
    const [elements, setElements, undo, redo] = useHistory([]);
    const [action, setAction] = useState("none");
    const [tool, setTool] = useState<string>("pencil");
    const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
    const [drawingColor, setDrawingColor] = useState<string>('#FFFFFF');

    const textAreaRef = useRef<HTMLTextAreaElement>(null);

        // State for LaTeX integration
    const [dictOfVars, setDictOfVars] = useState<Record<string, string>>({}); // Stores variables and their values
    const [result, setResult] = useState<GeneratedResult | undefined>(); // Stores the latest calculation result
    const [latexExpression, setLatexExpression] = useState<Array<string>>([]); // Stores an array of LaTeX strings to render
    const [latexPosition, setLatexPosition] = useState({ x: 0, y: 0 }); // Initial position for draggable LaTeX
    const [resetState, setResetState] = useState(false); // For triggering full reset

    const { isSignedIn, isLoaded  } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
      if (isLoaded && !isSignedIn) {
        navigate("/sign-in");
      }
    }, [isLoaded, isSignedIn, navigate]);

    const nodeRef = React.useRef(null);

    // MathJax script loading and configuration
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML';
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
            if (window.MathJax) { // Check if MathJax is available on window
                window.MathJax.Hub.Config({
                    tex2jax: {inlineMath: [['$', '$'], ['\\(', '\\)']]},
                });
            }
        };

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    // Effect to typeset LaTeX expressions when they change
    useEffect(() => {
        if (latexExpression.length > 0 && window.MathJax) {
            // Use setTimeout to ensure DOM is updated before MathJax tries to typeset
            setTimeout(() => {
                window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
            }, 0);
        }
    }, [latexExpression]);

    // Effect to render LaTeX output when result changes
    useEffect(() => {
        if (result) {
            renderLatexOutput(result.expression, result.answer);
        }
    }, [result]);

    // Effect to handle full reset
    useEffect(() => {
        if (resetState) {
            handleResetAll();
            setResetState(false); // Reset the trigger
        }
    }, [resetState]);

    const updateElement = (id: number, x1: number, y1: number, x2: number, y2: number, type: string, options?: {text?: string, points?: Point[], color?: string}) => {
      const elementsCopy = [...elements];
      switch(type) {
        case "line":
        case "rectangle":
        case "circle":
          elementsCopy[id] = createElement(id, x1, y1, x2, y2, type, options?.color || elementsCopy[id].color);
          break;
        case "pencil":
          if (elementsCopy[id].points) {
              elementsCopy[id] = {
                ...elementsCopy[id],
                points: [...(elementsCopy[id].points as Point[]), { x: x2, y: y2 }]
            };
          }
          break;
        case "text":
          const tw = document.getElementById("canvas") as HTMLCanvasElement | null;
          if (!tw) return;
          const context = tw.getContext("2d");
          if (!context) return;
          const textWidth = context.measureText(options.text).width;
          const textHeight = 24;
          elementsCopy[id] = {
            ...createElement(id, x1, y1, x1 + textWidth, y1 + textHeight, type, options?.color || elementsCopy[id].color),
            text: options?.text
          };
          break;
        default:
          throw new Error(`Type not recognized: ${type}`);
      }

      setElements(elementsCopy, true);
    };

    useLayoutEffect(() => {
        const canvas = document.getElementById("canvas") as HTMLCanvasElement | null;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const roughCanvas = rough.canvas(canvas);
        elements.forEach(element => {
          if (action === "writing" && selectedElement?.id === element.id) return;
          drawElement(roughCanvas, ctx, element)});
        
    }, [elements, action, selectedElement]);

    useEffect(() => {
      const undoRedoFunction = (event: KeyboardEvent) => {
        if ((event.metaKey || event.ctrlKey)) {
          if (event.key === 'z' && event.shiftKey) {
            event.preventDefault();
            redo();
          } else if (event.key === 'z' && !event.shiftKey) {
            event.preventDefault();
            undo();
          } else if (event.key === 'y') {
            event.preventDefault();
            redo();
          }
        }
      };
      document.addEventListener("keydown", undoRedoFunction);
      return () => {
        document.removeEventListener("keydown", undoRedoFunction);
      }
    },[undo, redo]);

    useEffect(() => {
      if (action === "writing" && textAreaRef.current) {
        setTimeout(() => {
        textAreaRef.current?.focus();
        textAreaRef.current.value = selectedElement?.text;
      }, 0);
      }
    }, [action, selectedElement]);

    const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (action === "writing") return;
      const {clientX, clientY} = event;
      if (tool === "selection") {
        const element = getElementAtPosition(clientX, clientY, elements);
        if (element) {
          if (element.type === "pencil") {
            const xOffsets = element.points!.map(point => clientX - point.x);
            const yOffsets = element.points!.map(point => clientY - point.y);
            setSelectedElement({...element, xOffsets, yOffsets});
          } else {
            const offsetX = clientX - element.x1;
            const offsetY = clientY - element.y1;
            setSelectedElement({...element, offsetX, offsetY});
          }
          setElements(prevState => prevState);

          if (element.position === "inside") {
            setAction("moving");
          } else {
            setAction("resize");
          }
        }
      } else {
        const id = elements.length;

        const element = createElement(id, clientX, clientY, clientX, clientY, tool, drawingColor);
        setElements(prevState => [...prevState, element]);
        setSelectedElement({ ...element, offsetX: 0, offsetY: 0, position: null, color: drawingColor });

        setAction(tool === "text" ? "writing" : "drawing");
      }
      
    };

    const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
      const {clientX, clientY} = event;

      if (tool === "selection") {
        const target = event.target as HTMLCanvasElement;
        const element = getElementAtPosition(clientX, clientY, elements);
        target.style.cursor = element ? cursorForPosition(element.position) : "default";
      }


      if (action === "drawing") {
        const index = elements.length - 1;

        const {x1, y1} = elements[index];

        updateElement(index, x1, y1, clientX, clientY, tool, {color: drawingColor});
      
      } else if (action === "moving" && selectedElement) {
        if (selectedElement.type === "pencil") {
          const {id} = selectedElement;
          const newPoints = selectedElement.points!.map((_, index) => ({
              x: clientX - selectedElement.xOffsets![index],
              y: clientY - selectedElement.yOffsets![index]
            }))
            const elementsCopy = [...elements];
            elementsCopy[id] = {
              ...elementsCopy[id],
              points: newPoints
            };
            setElements(elementsCopy, true);
        } else {
          const {id, x1, x2, y1, y2, type, offsetX, offsetY} = selectedElement;

          const width = x2 - x1;
          const height = y2 - y1;

          const newX1 = clientX - offsetX;
          const newY1 = clientY - offsetY;
          const options = type === "text" ? {text : selectedElement.text, color: selectedElement.color} : {color: selectedElement.color};
          updateElement(id, newX1, newY1, newX1 + width, newY1 + height, type, options);
        }
      } else if (action === "resize" && selectedElement) {
        const {id, type, position, ...coordinates} = selectedElement;
        const {x1, y1, x2, y2} = resizedCoordinates(clientX, clientY, position ?? "", coordinates as any, selectedElement.type);
        updateElement(id, x1, y1, x2, y2, type, { color: selectedElement.color });
      }
    };

    const handleMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
      const {clientX, clientY} = event;
      if (selectedElement) {
        if (selectedElement.type === "text" && 
          clientX - selectedElement.offsetX === selectedElement.x1 &&
          clientY - selectedElement.offsetY === selectedElement.y1
        ) {
          setAction("writing");
          return;
        }
        const index = selectedElement.id;

        const {id, type} = elements[index];
        if ((action === "drawing" || action === "resize") && adjustmentRequired(type)) {
          const {x1, y1, x2, y2} = adjustElementCoordinates(elements[index]);

          updateElement(id, x1, y1, x2, y2, type, { color: selectedElement.color });
        }
      }

      if (action === "writing") return;
      setAction("none");
      setSelectedElement(null);
    };

    const handleBlur = () => {
      const {id, x1, y1, type} = selectedElement;
      setAction("none");
      setSelectedElement(null);
      updateElement(id, x1, y1, null, null, type, {text: event.target!.value});
    }

    const renderLatexOutput = (expression: string, answer: string) => {
        const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;
        setLatexExpression(prev => [...prev, latex]); // Add new latex expression to array

        // Clear the main canvas after rendering the result for consistency with Home component
        // const canvas = document.getElementById("canvas") as HTMLCanvasElement;
        // if (canvas) {
        //     const ctx = canvas.getContext('2d');
        //     if (ctx) {
        //         ctx.clearRect(0, 0, canvas.width, canvas.height);
        //     }
        // }
        // // Also clear drawing elements after a calculation, if that's desired
        // setElements([]);
    };

    const [loading, setLoading] = useState(false);
    const runRoute = async () => {
        setLoading(true);
        const canvas = document.getElementById("canvas") as HTMLCanvasElement;

        if (!canvas) {
          setLoading(false);
          return;
        }
        if (canvas) {
            try {
                const response = await axios({
                    method: 'post',
                    url: `${import.meta.env.VITE_API_URL}/calculate`, // Ensure VITE_API_URL is defined
                    data: {
                        image: canvas.toDataURL('image/png'),
                        dict_of_vars: dictOfVars
                    }
                });

                const respData = await response.data; // Using respData to avoid clash with `Response` interface
                console.log('Response', respData);

                // Update dictOfVars with new assignments
                respData.data.forEach((data: ResponseData) => {
                    if (data.assign === true) {
                        setDictOfVars(prev => ({
                            ...prev,
                            [data.expr]: data.result
                        }));
                    }
                });

                const context = canvas.getContext('2d');
                const imageData = context!.getImageData(0, 0, canvas.width, canvas.height);

                let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;

                for (let y = 0; y < canvas.height; y++) {
                    for (let x = 0; x < canvas.width; x++) {
                        const i = (y * canvas.width + x) * 4;
                        if (imageData.data[i + 3] > 0) {  // If pixel is not transparent
                            minX = Math.min(minX, x);
                            minY = Math.min(minY, y);
                            maxX = Math.max(maxX, x);
                            maxY = Math.max(maxY, y);
                        }
                    }
                }

                const centerX = (minX + maxX ) / 2;
                const centerY = (minY + maxY ) / 2;

                setLatexPosition({ x: centerX, y: centerY });

                // Set the result to trigger LaTeX rendering
                respData.data.forEach((data: ResponseData) => {
                    setResult({
                        expression: data.expr,
                        answer: data.result
                    });
                });

                // Clear the drawing from the canvas after processing
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    // Also clear elements array to truly reset the drawing
                    setElements([]);
                }

            } catch (error) {
                console.error("Error calling API:", error);
                // Handle error (e.g., show an error message to user)
            } finally {
              setLoading(false);
            }
        }
    };

    const handleResetAll = () => {
        // Clear drawing elements
        setElements([]);
        // Clear LaTeX expressions
        setLatexExpression([]);
        // Clear results
        setResult(undefined);
        // Clear variables dictionary
        setDictOfVars({});
        // Clear the canvas directly
        const canvas = document.getElementById("canvas") as HTMLCanvasElement;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

  return (
    <TooltipProvider>
    <div>
      <DotBackground/>
      <a href="/" className="fixed top-3 left-3 sm:top-4 sm:left-4 z-50 font-semibold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-sky-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent">
        VoxelTalk
      </a>
      <div className="fixed z-10 bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Toolbar
          activeTool={tool}
          onToolSelect={setTool} // Pass the state setter to the Toolbar
          activeColor={drawingColor} // Pass active color to Toolbar
          onColorSelect={setDrawingColor}
        />
      </div>
      <ShimmerButton
        onClick={runRoute} // Now triggers the API call
        className="fixed top-4 left-1/2 -translate-x-1/2 z-20 bg-gradient-to-r from-pink-500 via-blue-500 to-purple-500 text-white text-xl rounded-full shadow-md animate-gradient btn-gradient-border transition ease-in-out duration-500 transform hover:scale-105 flex items-center justify-center gap-2"
        disabled={loading} // Button is disabled when loading
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-8 w-8 animate-spin transition ease-in-out duration-2500" /> {/* Loader spinner */}
            Solving...
          </>
        ) : (
          <>
            Solve
            <Sparkles style={{ width: '24px', height: '24' }} className='text-white'/> {/* Sparkles icon */}
          </>
        )}
      </ShimmerButton>
      <div className="absolute bottom-4 right-4  overflow-hidden">
        <FamilyButton>
          <div className="mt-3 flex flex-col items-center justify-center space-y-3"> {/* Added flex container for column layout and centering */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={undo}
                  variant='ghost'
                  className='rounded-xl'
                >
                  Undo
                  <Undo2 />
                </Button>
              </TooltipTrigger>
              <TooltipContent className='text-center'>
                <p>(Ctrl + Z) <br />
                Revert the last action</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={redo}
                  variant='ghost'
                  className='rounded-xl'
                >
                  Redo
                  <Redo2 />
                </Button>
              </TooltipTrigger>
              <TooltipContent className='text-center'>
                <p>
                  (Ctrl + Y) <br />
                  Repeat the last undone action
                </p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setResetState(true)}
                  variant='ghost'
                  className='rounded-xl'
                >
                  Reset 
                  <Trash2Icon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Clear the canvas and all content
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </FamilyButton>
      </div>
       {action === "writing" ? (
        <textarea
          ref={textAreaRef}
          onBlur={handleBlur}
          style={{
            position: "fixed",
            color: drawingColor,
            top: selectedElement!.y1 - 2,
            left: selectedElement!.x1,
            font: "24px sans-serif",
            margin: 0,
            padding: 0,
            border: 0,
            outline: 0,
            resize: "none",
            overflow: "hidden",
            whiteSpace: "pre-wrap",
            background: "transparent",
            zIndex: 10,
          }}
        />
      ) : null}
      <canvas 
        id = "canvas" 
        width={window.innerWidth}
        height={window.innerHeight}
        className='absolute top-0 left-0 w-full h-full bg-transparent'
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ zIndex: 0 }}
      >
          Canvas
      </canvas>
      {latexExpression && latexExpression.map((latex, index) => (
          <Draggable
              key={index}
              nodeRef={nodeRef}
              defaultPosition={latexPosition} // Use defaultPosition for initial placement
              onStop={(e, data) => setLatexPosition({ x: data.x, y: data.y })}
              //bounds="parent" // Confine dragging to the parent element (or 'body')
          >
              <div className="absolute p-2 text-white cursor-move rounded" style={{ zIndex: 100 }} ref={nodeRef}>
                  <div className="latex-content">{latex}</div>
              </div>
          </Draggable>
      ))}
    </div>
    </TooltipProvider>
  )
}

export default Test

declare global {
  interface Window {
    MathJax: any;
  }
}
