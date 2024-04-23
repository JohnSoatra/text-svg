import * as makerjs from "makerjs";
import * as opentype from "opentype.js";
import { Shape, interpolate } from "flubber";
import * as d3 from "d3";

type Props = {
    text: string;
    size?: number;
    fontUrl?: string,
    combine?: boolean;
    center?: boolean;
    accuracy?: number;
    separate?: boolean;
    textOptions?: opentype.RenderOptions;
    svgOptions?: makerjs.exporter.ISVGPathDataRenderOptions;
    dxfOptions?: makerjs.exporter.IDXFRenderOptions;
};

type Returns = {
    path: string | makerjs.exporter.IPathDataByLayerMap;
    dxf: string;
    svg: SVGElement,
};

async function loadFont(fontUrl: string): Promise<opentype.Font> {
    return new Promise((resolve) =>
        opentype.load(fontUrl || "./assets/Roboto-Regular.ttf", (error, font) => {
            if (error) {
                throw Error('cannot load font');
            }

            resolve(font);
        })
    );
}

async function createTextSvg({
    text,
    size,
    fontUrl,
    combine,
    center,
    accuracy,
    separate,
    textOptions,
    svgOptions,
    dxfOptions,
}: Props): Promise<Returns> {
    const textModel = new makerjs.models.Text(
        await loadFont(fontUrl),
        text,
        size || 16,
        combine,
        center,
        accuracy,
        textOptions
    );

    if (separate !== undefined) {
        for (let key in textModel.models) {
            textModel.models[key].layer = key;
        }
    }

    const path = makerjs.exporter.toSVGPathData(textModel, svgOptions);
    const dxf = makerjs.exporter.toDXF(textModel, dxfOptions);
    const svg = makerjs.exporter.toSVG(textModel, svgOptions);

    const div = document.createElement('div');
    div.innerHTML = svg;

    return {
        path,
        dxf,
        svg: div.children[0] as SVGElement,
    };
}

async function test() {
    const a = await createTextSvg({text: 'ក', textOptions: { kerning: true }, svgOptions: { accuracy: 0 }});
    const b = await createTextSvg({text: 'ខ'});

    const mySvg = document.getElementById('my-svg');
    const myPath = document.getElementById('my-path');

    mySvg.setAttribute('viewBox', a.svg.getAttribute('viewBox'));
    // myPath.setAttribute('d', a.path.toString());

    // const div = document.createElement('div');
    // div.innerHTML = svg.svg;
    // const svgElement = (div.children[0] as SVGElement);
    // console.log(svgElement.getAttribute('viewBox'));
    const interpolator = interpolate(
        a.path as Shape,
        b.path as Shape,
        {
            maxSegmentLength: 0.1
        }
    );
    
    d3.select('path#my-path')
        .transition()
        .attrTween("d", function(){ return interpolator; })
        .duration(10000)

    // document.body.appendChild(div);
}

test();
