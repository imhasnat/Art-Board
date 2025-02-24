import React, { useRef, useEffect, useState } from "react";
import "./App.css";

function App() {
  const CANVAS_CONFIG = {
    strokeStyle: "black",
    lineWidth: 2,
    eraserThreshold: 8,
    backgroundColor: "white",
  };

  const TOOLS = {
    PEN: "pen",
    ERASER: "eraser",
  };

  const CURSOR_STYLES = {
    [TOOLS.PEN]: "crosshair",
    [TOOLS.ERASER]: "cell",
  };

  const canvasRef = useRef(null);
  const [tool, setTool] = useState(TOOLS.PEN);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorStyle, setCursorStyle] = useState(CURSOR_STYLES[TOOLS.PEN]);
  const [lines, setLines] = useState([]);
  const [currentLine, setCurrentLine] = useState([]);

  const getContext = () => {
    const canvas = canvasRef.current;
    return canvas.getContext("2d");
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = getContext();

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.fillStyle = CANVAS_CONFIG.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getMousePosition = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const drawLineSegment = (ctx, startPoint, endPoint) => {
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.strokeStyle = CANVAS_CONFIG.strokeStyle;
    ctx.lineWidth = CANVAS_CONFIG.lineWidth;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const clearCanvas = (ctx) => {
    const canvas = canvasRef.current;
    ctx.fillStyle = CANVAS_CONFIG.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const redrawCanvas = () => {
    const ctx = getContext();
    clearCanvas(ctx);

    lines.forEach((line) => {
      if (line.length > 1) {
        line.forEach((point, index) => {
          if (index > 0) {
            drawLineSegment(ctx, line[index - 1], point);
          }
        });
      }
    });
  };

  const startDrawing = (event) => {
    if (tool === TOOLS.PEN) {
      const point = getMousePosition(event);
      setIsDrawing(true);
      setCurrentLine([point]);
    }
  };

  const draw = (event) => {
    const point = getMousePosition(event);

    if (tool === TOOLS.PEN && isDrawing) {
      handlePenDrawing(point);
    } else if (tool === TOOLS.ERASER) {
      handleErasing(point);
    }
  };

  const handlePenDrawing = (point) => {
    const ctx = getContext();
    setCurrentLine((prev) => {
      const newLine = [...prev, point];
      if (newLine.length > 1) {
        const [secondLastPoint, lastPoint] = newLine.slice(-2);
        drawLineSegment(ctx, secondLastPoint, lastPoint);
      }
      return newLine;
    });
  };

  const handleErasing = (point) => {
    const lineToEraseIndex = findLineToErase(point.x, point.y);
    if (lineToEraseIndex !== -1) {
      setLines((prevLines) =>
        prevLines.filter((_, index) => index !== lineToEraseIndex)
      );
    }
  };

  const stopDrawing = () => {
    if (isDrawing && tool === TOOLS.PEN && currentLine.length > 1) {
      setLines((prev) => [...prev, currentLine]);
    }
    setIsDrawing(false);
    setCurrentLine([]);
  };

  const findLineToErase = (x, y) => {
    return lines.findIndex((line) =>
      line.some(
        (point, index) =>
          index < line.length - 1 &&
          isPointNearLineSegment(
            x,
            y,
            point.x,
            point.y,
            line[index + 1].x,
            line[index + 1].y
          )
      )
    );
  };

  const isPointNearLineSegment = (x, y, x1, y1, x2, y2) => {
    const distance = calculatePointToLineDistance(x, y, x1, y1, x2, y2);
    return distance < CANVAS_CONFIG.eraserThreshold;
  };

  const calculatePointToLineDistance = (
    pointX,
    pointY,
    lineStartX,
    lineStartY,
    lineEndX,
    lineEndY
  ) => {
    const vectorToPointX = pointX - lineStartX;
    const vectorToPointY = pointY - lineStartY;

    const lineVectorX = lineEndX - lineStartX;
    const lineVectorY = lineEndY - lineStartY;

    const dotProduct =
      vectorToPointX * lineVectorX + vectorToPointY * lineVectorY;
    const lineLengthSquared =
      lineVectorX * lineVectorX + lineVectorY * lineVectorY;

    const projection = lineLengthSquared ? dotProduct / lineLengthSquared : -1;

    let closestX, closestY;
    if (projection < 0) {
      [closestX, closestY] = [lineStartX, lineStartY];
    } else if (projection > 1) {
      [closestX, closestY] = [lineEndX, lineEndY];
    } else {
      closestX = lineStartX + projection * lineVectorX;
      closestY = lineStartY + projection * lineVectorY;
    }

    const distanceX = pointX - closestX;
    const distanceY = pointY - closestY;
    return Math.sqrt(distanceX * distanceX + distanceY * distanceY);
  };

  const handleToolChange = (selectedTool) => {
    setTool(selectedTool);
    setCursorStyle(CURSOR_STYLES[selectedTool]);
  };

  useEffect(() => {
    redrawCanvas();
  }, [lines]);

  return (
    <div className="App">
      <div className="toolbar">
        {Object.values(TOOLS).map((toolName) => (
          <button
            key={toolName}
            onClick={() => handleToolChange(toolName)}
            className={tool === toolName ? "active" : ""}
          >
            {toolName.charAt(0).toUpperCase() + toolName.slice(1)}
          </button>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        style={{ cursor: cursorStyle }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
      />
    </div>
  );
}

export default App;
