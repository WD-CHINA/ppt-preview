import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import JSZip from 'jszip'

const outputPath = fileURLToPath(new URL('../public/chart-diagram-fixture.pptx', import.meta.url))

const slide1Xml = `<?xml version="1.0" encoding="UTF-8"?>
  <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart">
    <p:cSld>
      <p:spTree>
        <p:graphicFrame>
          <p:nvGraphicFramePr>
            <p:cNvPr id="9" name="Chart 1"/>
            <p:cNvGraphicFramePr/>
            <p:nvPr/>
          </p:nvGraphicFramePr>
          <p:xfrm>
            <a:off x="0" y="0"/>
            <a:ext cx="3657600" cy="2286000"/>
          </p:xfrm>
          <a:graphic>
            <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">
              <c:chart r:id="rIdChart1"/>
            </a:graphicData>
          </a:graphic>
        </p:graphicFrame>
      </p:spTree>
    </p:cSld>
  </p:sld>`

const slide1RelsXml = `<?xml version="1.0" encoding="UTF-8"?>
  <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rIdLayout" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
    <Relationship Id="rIdChart1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart1.xml"/>
  </Relationships>`

const chartXml = `<?xml version="1.0" encoding="UTF-8"?>
  <c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
    <c:chart>
      <c:title>
        <c:tx>
          <c:rich>
            <a:bodyPr/>
            <a:lstStyle/>
            <a:p><a:r><a:t>Revenue</a:t></a:r></a:p>
          </c:rich>
        </c:tx>
      </c:title>
      <c:plotArea>
        <c:barChart>
          <c:barDir val="col"/>
          <c:grouping val="clustered"/>
          <c:varyColors val="1"/>
          <c:gapWidth val="219"/>
          <c:overlap val="-27"/>
          <c:ser>
            <c:idx val="0"/>
            <c:order val="1"/>
            <c:tx><c:strRef><c:strCache><c:pt idx="0"><c:v>Series 1</c:v></c:pt></c:strCache></c:strRef></c:tx>
            <c:cat><c:strRef><c:strCache><c:pt idx="0"><c:v>Q1</c:v></c:pt><c:pt idx="1"><c:v>Q2</c:v></c:pt></c:strCache></c:strRef></c:cat>
            <c:val><c:numRef><c:numCache><c:pt idx="0"><c:v>10</c:v></c:pt><c:pt idx="1"><c:v>20</c:v></c:pt></c:numCache></c:numRef></c:val>
            <c:spPr><a:solidFill><a:srgbClr val="3366CC"/></a:solidFill></c:spPr>
          </c:ser>
          <c:ser>
            <c:idx val="1"/>
            <c:order val="0"/>
            <c:tx><c:strRef><c:strCache><c:pt idx="0"><c:v>Series 2</c:v></c:pt></c:strCache></c:strRef></c:tx>
            <c:cat><c:strRef><c:strCache><c:pt idx="0"><c:v>Q1</c:v></c:pt><c:pt idx="1"><c:v>Q2</c:v></c:pt></c:strCache></c:strRef></c:cat>
            <c:val><c:numRef><c:numCache><c:pt idx="0"><c:v>30</c:v></c:pt><c:pt idx="1"><c:v>40</c:v></c:pt></c:numCache></c:numRef></c:val>
            <c:spPr><a:solidFill><a:srgbClr val="DC3912"/></a:solidFill></c:spPr>
          </c:ser>
          <c:dLbls>
            <c:dLblPos val="outEnd"/>
            <c:showVal val="1"/>
            <c:showCatName val="1"/>
          </c:dLbls>
        </c:barChart>
        <c:catAx>
          <c:axId val="10"/>
          <c:scaling><c:orientation val="maxMin"/></c:scaling>
          <c:axPos val="b"/>
          <c:crosses val="autoZero"/>
          <c:title>
            <c:tx>
              <c:rich>
                <a:bodyPr/>
                <a:lstStyle/>
                <a:p><a:r><a:t>Quarter</a:t></a:r></a:p>
              </c:rich>
            </c:tx>
          </c:title>
          <c:majorGridlines/>
        </c:catAx>
        <c:valAx>
          <c:axId val="20"/>
          <c:scaling><c:orientation val="minMax"/></c:scaling>
          <c:axPos val="l"/>
          <c:title>
            <c:tx>
              <c:rich>
                <a:bodyPr/>
                <a:lstStyle/>
                <a:p><a:r><a:t>Amount</a:t></a:r></a:p>
              </c:rich>
            </c:tx>
          </c:title>
          <c:minorGridlines/>
        </c:valAx>
      </c:plotArea>
      <c:legend>
        <c:legendPos val="r"/>
        <c:overlay val="0"/>
      </c:legend>
    </c:chart>
  </c:chartSpace>`

const slide2Xml = `<?xml version="1.0" encoding="UTF-8"?>
  <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram">
    <p:cSld>
      <p:spTree>
        <p:graphicFrame>
          <p:nvGraphicFramePr>
            <p:cNvPr id="7" name="SmartArt 1"/>
            <p:cNvGraphicFramePr/>
            <p:nvPr/>
          </p:nvGraphicFramePr>
          <p:xfrm>
            <a:off x="0" y="0"/>
            <a:ext cx="3657600" cy="2743200"/>
          </p:xfrm>
          <a:graphic>
            <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/diagram">
              <dgm:relIds r:dm="rIdDm" r:lo="rIdLo" r:qs="rIdQs" r:cs="rIdCs"/>
            </a:graphicData>
          </a:graphic>
        </p:graphicFrame>
      </p:spTree>
    </p:cSld>
  </p:sld>`

const slide2RelsXml = `<?xml version="1.0" encoding="UTF-8"?>
  <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rIdLayout" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
    <Relationship Id="rIdDm" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/diagramData" Target="../diagrams/data1.xml"/>
    <Relationship Id="rIdLo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/diagramLayout" Target="../diagrams/layout1.xml"/>
    <Relationship Id="rIdQs" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/diagramQuickStyle" Target="../diagrams/quickStyle1.xml"/>
    <Relationship Id="rIdCs" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/diagramColors" Target="../diagrams/colors1.xml"/>
    <Relationship Id="rIdDrawing" Type="http://schemas.microsoft.com/office/2007/relationships/diagramDrawing" Target="../diagrams/drawing1.xml"/>
  </Relationships>`

const slide3Xml = `<?xml version="1.0" encoding="UTF-8"?>
  <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart">
    <p:cSld>
      <p:spTree>
        <p:graphicFrame>
          <p:nvGraphicFramePr>
            <p:cNvPr id="12" name="Pie 1"/>
            <p:cNvGraphicFramePr/>
            <p:nvPr/>
          </p:nvGraphicFramePr>
          <p:xfrm>
            <a:off x="0" y="0"/>
            <a:ext cx="3657600" cy="2286000"/>
          </p:xfrm>
          <a:graphic>
            <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">
              <c:chart r:id="rIdChart2"/>
            </a:graphicData>
          </a:graphic>
        </p:graphicFrame>
      </p:spTree>
    </p:cSld>
  </p:sld>`

const slide3RelsXml = `<?xml version="1.0" encoding="UTF-8"?>
  <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rIdLayout" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
    <Relationship Id="rIdChart2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart2.xml"/>
  </Relationships>`

const pieChartXml = `<?xml version="1.0" encoding="UTF-8"?>
  <c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
    <c:chart>
      <c:title>
        <c:tx>
          <c:rich>
            <a:bodyPr/>
            <a:lstStyle/>
            <a:p><a:r><a:t>Share</a:t></a:r></a:p>
          </c:rich>
        </c:tx>
      </c:title>
      <c:plotArea>
        <c:pieChart>
          <c:varyColors val="1"/>
          <c:ser>
            <c:idx val="0"/>
            <c:order val="0"/>
            <c:tx><c:strRef><c:strCache><c:pt idx="0"><c:v>Share</c:v></c:pt></c:strCache></c:strRef></c:tx>
            <c:cat><c:strRef><c:strCache><c:pt idx="0"><c:v>A</c:v></c:pt><c:pt idx="1"><c:v>B</c:v></c:pt></c:strCache></c:strRef></c:cat>
            <c:val><c:numRef><c:numCache><c:pt idx="0"><c:v>60</c:v></c:pt><c:pt idx="1"><c:v>40</c:v></c:pt></c:numCache></c:numRef></c:val>
            <c:dPt><c:idx val="0"/><c:spPr><a:solidFill><a:srgbClr val="3366CC"/></a:solidFill></c:spPr></c:dPt>
            <c:dPt><c:idx val="1"/><c:spPr><a:solidFill><a:srgbClr val="DC3912"/></a:solidFill></c:spPr></c:dPt>
          </c:ser>
        </c:pieChart>
      </c:plotArea>
      <c:legend>
        <c:legendPos val="r"/>
        <c:overlay val="0"/>
      </c:legend>
    </c:chart>
  </c:chartSpace>`

const slide4Xml = `<?xml version="1.0" encoding="UTF-8"?>
  <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart">
    <p:cSld>
      <p:spTree>
        <p:graphicFrame>
          <p:nvGraphicFramePr>
            <p:cNvPr id="13" name="Scatter 1"/>
            <p:cNvGraphicFramePr/>
            <p:nvPr/>
          </p:nvGraphicFramePr>
          <p:xfrm>
            <a:off x="0" y="0"/>
            <a:ext cx="3657600" cy="2286000"/>
          </p:xfrm>
          <a:graphic>
            <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">
              <c:chart r:id="rIdChart3"/>
            </a:graphicData>
          </a:graphic>
        </p:graphicFrame>
      </p:spTree>
    </p:cSld>
  </p:sld>`

const slide4RelsXml = `<?xml version="1.0" encoding="UTF-8"?>
  <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rIdLayout" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
    <Relationship Id="rIdChart3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart3.xml"/>
  </Relationships>`

const scatterChartXml = `<?xml version="1.0" encoding="UTF-8"?>
  <c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
    <c:chart>
      <c:title>
        <c:tx>
          <c:rich>
            <a:bodyPr/>
            <a:lstStyle/>
            <a:p><a:r><a:t>Series XY</a:t></a:r></a:p>
          </c:rich>
        </c:tx>
      </c:title>
      <c:plotArea>
        <c:scatterChart>
          <c:scatterStyle val="lineMarker"/>
          <c:ser>
            <c:idx val="0"/>
            <c:order val="0"/>
            <c:tx><c:strRef><c:strCache><c:pt idx="0"><c:v>Series XY</c:v></c:pt></c:strCache></c:strRef></c:tx>
            <c:xVal><c:numRef><c:numCache><c:pt idx="0"><c:v>1</c:v></c:pt><c:pt idx="1"><c:v>2</c:v></c:pt></c:numCache></c:numRef></c:xVal>
            <c:yVal><c:numRef><c:numCache><c:pt idx="0"><c:v>10</c:v></c:pt><c:pt idx="1"><c:v>20</c:v></c:pt></c:numCache></c:numRef></c:yVal>
            <c:spPr><a:solidFill><a:srgbClr val="3366CC"/></a:solidFill></c:spPr>
          </c:ser>
        </c:scatterChart>
      </c:plotArea>
      <c:legend>
        <c:legendPos val="r"/>
        <c:overlay val="0"/>
      </c:legend>
    </c:chart>
  </c:chartSpace>`

const slide5Xml = `<?xml version="1.0" encoding="UTF-8"?>
  <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart">
    <p:cSld>
      <p:spTree>
        <p:graphicFrame>
          <p:nvGraphicFramePr>
            <p:cNvPr id="14" name="Line 1"/>
            <p:cNvGraphicFramePr/>
            <p:nvPr/>
          </p:nvGraphicFramePr>
          <p:xfrm>
            <a:off x="0" y="0"/>
            <a:ext cx="3657600" cy="2286000"/>
          </p:xfrm>
          <a:graphic>
            <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">
              <c:chart r:id="rIdChart4"/>
            </a:graphicData>
          </a:graphic>
        </p:graphicFrame>
      </p:spTree>
    </p:cSld>
  </p:sld>`

const slide5RelsXml = `<?xml version="1.0" encoding="UTF-8"?>
  <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rIdLayout" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
    <Relationship Id="rIdChart4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart4.xml"/>
  </Relationships>`

const lineChartXml = `<?xml version="1.0" encoding="UTF-8"?>
  <c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
    <c:chart>
      <c:title>
        <c:tx>
          <c:rich>
            <a:bodyPr/>
            <a:lstStyle/>
            <a:p><a:r><a:t>Trend</a:t></a:r></a:p>
          </c:rich>
        </c:tx>
      </c:title>
      <c:plotArea>
        <c:lineChart>
          <c:grouping val="standard"/>
          <c:marker val="1"/>
          <c:ser>
            <c:idx val="0"/>
            <c:order val="0"/>
            <c:tx><c:strRef><c:strCache><c:pt idx="0"><c:v>North</c:v></c:pt></c:strCache></c:strRef></c:tx>
            <c:cat><c:strRef><c:strCache><c:pt idx="0"><c:v>Jan</c:v></c:pt><c:pt idx="1"><c:v>Feb</c:v></c:pt><c:pt idx="2"><c:v>Mar</c:v></c:pt></c:strCache></c:strRef></c:cat>
            <c:val><c:numRef><c:numCache><c:pt idx="0"><c:v>10</c:v></c:pt><c:pt idx="1"><c:v>20</c:v></c:pt><c:pt idx="2"><c:v>15</c:v></c:pt></c:numCache></c:numRef></c:val>
            <c:spPr><a:solidFill><a:srgbClr val="3366CC"/></a:solidFill></c:spPr>
          </c:ser>
          <c:ser>
            <c:idx val="1"/>
            <c:order val="1"/>
            <c:tx><c:strRef><c:strCache><c:pt idx="0"><c:v>South</c:v></c:pt></c:strCache></c:strRef></c:tx>
            <c:cat><c:strRef><c:strCache><c:pt idx="0"><c:v>Jan</c:v></c:pt><c:pt idx="1"><c:v>Feb</c:v></c:pt><c:pt idx="2"><c:v>Mar</c:v></c:pt></c:strCache></c:strRef></c:cat>
            <c:val><c:numRef><c:numCache><c:pt idx="0"><c:v>5</c:v></c:pt><c:pt idx="1"><c:v>12</c:v></c:pt><c:pt idx="2"><c:v>18</c:v></c:pt></c:numCache></c:numRef></c:val>
            <c:spPr><a:solidFill><a:srgbClr val="DC3912"/></a:solidFill></c:spPr>
          </c:ser>
        </c:lineChart>
        <c:catAx>
          <c:axId val="30"/>
          <c:scaling><c:orientation val="minMax"/></c:scaling>
          <c:axPos val="b"/>
          <c:crosses val="autoZero"/>
          <c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>Month</a:t></a:r></a:p></c:rich></c:tx></c:title>
        </c:catAx>
        <c:valAx>
          <c:axId val="40"/>
          <c:scaling><c:orientation val="minMax"/></c:scaling>
          <c:axPos val="l"/>
          <c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>Score</a:t></a:r></a:p></c:rich></c:tx></c:title>
        </c:valAx>
      </c:plotArea>
      <c:legend>
        <c:legendPos val="r"/>
        <c:overlay val="0"/>
      </c:legend>
    </c:chart>
  </c:chartSpace>`

const slide6Xml = `<?xml version="1.0" encoding="UTF-8"?>
  <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart">
    <p:cSld>
      <p:spTree>
        <p:graphicFrame>
          <p:nvGraphicFramePr>
            <p:cNvPr id="15" name="Area 1"/>
            <p:cNvGraphicFramePr/>
            <p:nvPr/>
          </p:nvGraphicFramePr>
          <p:xfrm>
            <a:off x="0" y="0"/>
            <a:ext cx="3657600" cy="2286000"/>
          </p:xfrm>
          <a:graphic>
            <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">
              <c:chart r:id="rIdChart5"/>
            </a:graphicData>
          </a:graphic>
        </p:graphicFrame>
      </p:spTree>
    </p:cSld>
  </p:sld>`

const slide6RelsXml = `<?xml version="1.0" encoding="UTF-8"?>
  <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rIdLayout" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
    <Relationship Id="rIdChart5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart5.xml"/>
  </Relationships>`

const areaChartXml = `<?xml version="1.0" encoding="UTF-8"?>
  <c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
    <c:chart>
      <c:title>
        <c:tx>
          <c:rich>
            <a:bodyPr/>
            <a:lstStyle/>
            <a:p><a:r><a:t>Coverage</a:t></a:r></a:p>
          </c:rich>
        </c:tx>
      </c:title>
      <c:plotArea>
        <c:areaChart>
          <c:grouping val="standard"/>
          <c:ser>
            <c:idx val="0"/>
            <c:order val="0"/>
            <c:tx><c:strRef><c:strCache><c:pt idx="0"><c:v>Coverage</c:v></c:pt></c:strCache></c:strRef></c:tx>
            <c:cat><c:strRef><c:strCache><c:pt idx="0"><c:v>Q1</c:v></c:pt><c:pt idx="1"><c:v>Q2</c:v></c:pt></c:strCache></c:strRef></c:cat>
            <c:val><c:numRef><c:numCache><c:pt idx="0"><c:v>40</c:v></c:pt><c:pt idx="1"><c:v>60</c:v></c:pt></c:numCache></c:numRef></c:val>
            <c:spPr><a:solidFill><a:srgbClr val="3366CC"/></a:solidFill></c:spPr>
          </c:ser>
        </c:areaChart>
        <c:catAx>
          <c:axId val="50"/>
          <c:scaling><c:orientation val="minMax"/></c:scaling>
          <c:axPos val="b"/>
          <c:crosses val="autoZero"/>
        </c:catAx>
        <c:valAx>
          <c:axId val="60"/>
          <c:scaling><c:orientation val="minMax"/></c:scaling>
          <c:axPos val="l"/>
        </c:valAx>
      </c:plotArea>
      <c:legend>
        <c:legendPos val="r"/>
        <c:overlay val="0"/>
      </c:legend>
    </c:chart>
  </c:chartSpace>`

const slide7Xml = `<?xml version="1.0" encoding="UTF-8"?>
  <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram">
    <p:cSld>
      <p:spTree>
        <p:graphicFrame>
          <p:nvGraphicFramePr>
            <p:cNvPr id="16" name="Cycle SmartArt"/>
            <p:cNvGraphicFramePr/>
            <p:nvPr/>
          </p:nvGraphicFramePr>
          <p:xfrm>
            <a:off x="0" y="0"/>
            <a:ext cx="3657600" cy="2743200"/>
          </p:xfrm>
          <a:graphic>
            <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/diagram">
              <dgm:relIds r:dm="rIdDm2" r:lo="rIdLo2" r:qs="rIdQs2" r:cs="rIdCs2"/>
            </a:graphicData>
          </a:graphic>
        </p:graphicFrame>
      </p:spTree>
    </p:cSld>
  </p:sld>`

const slide7RelsXml = `<?xml version="1.0" encoding="UTF-8"?>
  <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rIdLayout" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
    <Relationship Id="rIdDm2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/diagramData" Target="../diagrams/data2.xml"/>
    <Relationship Id="rIdLo2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/diagramLayout" Target="../diagrams/layout2.xml"/>
    <Relationship Id="rIdQs2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/diagramQuickStyle" Target="../diagrams/quickStyle1.xml"/>
    <Relationship Id="rIdCs2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/diagramColors" Target="../diagrams/colors1.xml"/>
    <Relationship Id="rIdDrawing" Type="http://schemas.microsoft.com/office/2007/relationships/diagramDrawing" Target="../diagrams/drawing2.xml"/>
  </Relationships>`

const diagramLayoutXml = `<?xml version="1.0" encoding="UTF-8"?><dgm:layoutDef xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram" uniqueId="urn:microsoft.com/office/officeart/2005/8/layout/hierarchy1" title="Hierarchy"/>`
const diagramQuickStyleXml = `<?xml version="1.0" encoding="UTF-8"?><dgm:styleDef xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram"/>`
const diagramColorsXml = `<?xml version="1.0" encoding="UTF-8"?><dgm:colorsDef xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram"/>`

const diagramDataXml = `<?xml version="1.0" encoding="UTF-8"?>
  <dgm:dataModel xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:dsp="http://schemas.microsoft.com/office/drawing/2008/diagram">
    <dgm:ptLst>
      <dgm:pt modelId="0" type="node"><dgm:prSet presAssocID="root-assoc"/><dgm:t><a:p><a:r><a:t>Root</a:t></a:r></a:p></dgm:t></dgm:pt>
      <dgm:pt modelId="1" type="node"><dgm:t><a:p><a:r><a:t>Child A</a:t></a:r></a:p></dgm:t></dgm:pt>
      <dgm:pt modelId="2" type="node"><dgm:t><a:p><a:r><a:t>Child B</a:t></a:r></a:p></dgm:t></dgm:pt>
    </dgm:ptLst>
    <dgm:cxnLst>
      <dgm:cxn modelId="c1" type="parOf" srcId="0" destId="1" srcOrd="0" destOrd="0"/>
      <dgm:cxn modelId="c2" type="parOf" srcId="0" destId="2" srcOrd="0" destOrd="1"/>
    </dgm:cxnLst>
    <dgm:extLst>
      <a:ext uri="{4A6487B3-C4C0-4C67-BD6F-9E1B8C542F47}">
        <dsp:dataModelExt relId="rIdDrawing"/>
      </a:ext>
    </dgm:extLst>
  </dgm:dataModel>`

const diagramDrawingXml = `<?xml version="1.0" encoding="UTF-8"?>
  <dsp:drawing xmlns:dsp="http://schemas.microsoft.com/office/drawing/2008/diagram" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
    <dsp:spTree>
      <dsp:sp>
        <p:nvSpPr>
          <p:cNvPr id="10" name="Root Shape"/>
          <p:cNvSpPr/>
          <p:nvPr>
            <p:extLst>
              <a:ext uri="{smartart-node}">
                <dsp:spPr modelId="0" presAssocID="root-assoc"/>
              </a:ext>
            </p:extLst>
          </p:nvPr>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="0" y="0"/><a:ext cx="1000000" cy="500000"/></a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        </p:spPr>
        <p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>Root</a:t></a:r></a:p></p:txBody>
      </dsp:sp>
    </dsp:spTree>
  </dsp:drawing>`

const cycleDiagramLayoutXml = `<?xml version="1.0" encoding="UTF-8"?><dgm:layoutDef xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram" uniqueId="urn:microsoft.com/office/officeart/2005/8/layout/cycle1" title="Cycle"/>`

const cycleDiagramDataXml = `<?xml version="1.0" encoding="UTF-8"?>
  <dgm:dataModel xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:dsp="http://schemas.microsoft.com/office/drawing/2008/diagram">
    <dgm:ptLst>
      <dgm:pt modelId="10" type="node"><dgm:t><a:p><a:r><a:t>Plan</a:t></a:r></a:p></dgm:t></dgm:pt>
      <dgm:pt modelId="11" type="node"><dgm:t><a:p><a:r><a:t>Build</a:t></a:r></a:p></dgm:t></dgm:pt>
      <dgm:pt modelId="12" type="node"><dgm:t><a:p><a:r><a:t>Launch</a:t></a:r></a:p></dgm:t></dgm:pt>
    </dgm:ptLst>
    <dgm:cxnLst>
      <dgm:cxn modelId="cc1" type="parOf" srcId="10" destId="11" srcOrd="0" destOrd="0"/>
      <dgm:cxn modelId="cc2" type="parOf" srcId="10" destId="12" srcOrd="0" destOrd="1"/>
    </dgm:cxnLst>
    <dgm:extLst>
      <a:ext uri="{4A6487B3-C4C0-4C67-BD6F-9E1B8C542F47}">
        <dsp:dataModelExt relId="rIdDrawing"/>
      </a:ext>
    </dgm:extLst>
  </dgm:dataModel>`

const cycleDiagramDrawingXml = `<?xml version="1.0" encoding="UTF-8"?>
  <dsp:drawing xmlns:dsp="http://schemas.microsoft.com/office/drawing/2008/diagram" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
    <dsp:spTree>
      <dsp:sp>
        <p:nvSpPr>
          <p:cNvPr id="20" name="Plan Shape"/>
          <p:cNvSpPr/>
          <p:nvPr>
            <p:extLst>
              <a:ext uri="{smartart-node}">
                <dsp:spPr modelId="10"/>
              </a:ext>
            </p:extLst>
          </p:nvPr>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="0" y="0"/><a:ext cx="1000000" cy="500000"/></a:xfrm>
          <a:prstGeom prst="ellipse"><a:avLst/></a:prstGeom>
        </p:spPr>
        <p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>Plan</a:t></a:r></a:p></p:txBody>
      </dsp:sp>
    </dsp:spTree>
  </dsp:drawing>`

const zip = new JSZip()

zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>
  <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
    <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
    <Override PartName="/ppt/slides/slide2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
    <Override PartName="/ppt/slides/slide3.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
    <Override PartName="/ppt/slides/slide4.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
    <Override PartName="/ppt/slides/slide5.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
    <Override PartName="/ppt/slides/slide6.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
    <Override PartName="/ppt/slides/slide7.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
    <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
    <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
    <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
    <Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>
    <Override PartName="/ppt/charts/chart1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>
    <Override PartName="/ppt/charts/chart2.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>
    <Override PartName="/ppt/charts/chart3.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>
    <Override PartName="/ppt/charts/chart4.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>
    <Override PartName="/ppt/charts/chart5.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>
    <Override PartName="/ppt/diagrams/data1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.diagramData+xml"/>
    <Override PartName="/ppt/diagrams/data2.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.diagramData+xml"/>
    <Override PartName="/ppt/diagrams/layout1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.diagramLayout+xml"/>
    <Override PartName="/ppt/diagrams/layout2.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.diagramLayout+xml"/>
    <Override PartName="/ppt/diagrams/colors1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.diagramColors+xml"/>
    <Override PartName="/ppt/diagrams/quickStyle1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.diagramStyle+xml"/>
    <Override PartName="/ppt/diagrams/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.diagramDrawing+xml"/>
    <Override PartName="/ppt/diagrams/drawing2.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.diagramDrawing+xml"/>
  </Types>`)

zip.file('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8"?>
  <p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
    <p:sldSz cx="9144000" cy="6858000"/>
    <p:sldIdLst>
      <p:sldId id="256" r:id="rId1"/>
      <p:sldId id="257" r:id="rId2"/>
      <p:sldId id="258" r:id="rId3"/>
      <p:sldId id="259" r:id="rId4"/>
      <p:sldId id="260" r:id="rId5"/>
      <p:sldId id="261" r:id="rId6"/>
      <p:sldId id="262" r:id="rId7"/>
    </p:sldIdLst>
    <p:defaultTextStyle/>
  </p:presentation>`)

zip.file('ppt/_rels/presentation.xml.rels', `<?xml version="1.0" encoding="UTF-8"?>
  <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
    <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide2.xml"/>
    <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide3.xml"/>
    <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide4.xml"/>
    <Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide5.xml"/>
    <Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide6.xml"/>
    <Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide7.xml"/>
    <Relationship Id="rIdTheme" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
  </Relationships>`)

zip.file('ppt/slides/slide1.xml', slide1Xml)
zip.file('ppt/slides/_rels/slide1.xml.rels', slide1RelsXml)
zip.file('ppt/slides/slide2.xml', slide2Xml)
zip.file('ppt/slides/_rels/slide2.xml.rels', slide2RelsXml)
zip.file('ppt/slides/slide3.xml', slide3Xml)
zip.file('ppt/slides/_rels/slide3.xml.rels', slide3RelsXml)
zip.file('ppt/slides/slide4.xml', slide4Xml)
zip.file('ppt/slides/_rels/slide4.xml.rels', slide4RelsXml)
zip.file('ppt/slides/slide5.xml', slide5Xml)
zip.file('ppt/slides/_rels/slide5.xml.rels', slide5RelsXml)
zip.file('ppt/slides/slide6.xml', slide6Xml)
zip.file('ppt/slides/_rels/slide6.xml.rels', slide6RelsXml)
zip.file('ppt/slides/slide7.xml', slide7Xml)
zip.file('ppt/slides/_rels/slide7.xml.rels', slide7RelsXml)
zip.file('ppt/slideLayouts/slideLayout1.xml', `<?xml version="1.0" encoding="UTF-8"?><p:sldLayout xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree/></p:cSld></p:sldLayout>`)
zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdMaster" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`)
zip.file('ppt/slideMasters/slideMaster1.xml', `<?xml version="1.0" encoding="UTF-8"?><p:sldMaster xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree/></p:cSld><p:txStyles/></p:sldMaster>`)
zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdTheme" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>`)
zip.file('ppt/theme/theme1.xml', `<?xml version="1.0" encoding="UTF-8"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:themeElements><a:clrScheme name="Office"><a:accent1><a:srgbClr val="FF0000"/></a:accent1><a:accent2><a:srgbClr val="00FF00"/></a:accent2><a:accent3><a:srgbClr val="0000FF"/></a:accent3><a:accent4><a:srgbClr val="FFFF00"/></a:accent4><a:accent5><a:srgbClr val="00FFFF"/></a:accent5><a:accent6><a:srgbClr val="FF00FF"/></a:accent6></a:clrScheme></a:themeElements></a:theme>`)
zip.file('ppt/tableStyles.xml', `<?xml version="1.0" encoding="UTF-8"?><a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="tableStyleId"/>`)
zip.file('ppt/charts/chart1.xml', chartXml)
zip.file('ppt/charts/chart2.xml', pieChartXml)
zip.file('ppt/charts/chart3.xml', scatterChartXml)
zip.file('ppt/charts/chart4.xml', lineChartXml)
zip.file('ppt/charts/chart5.xml', areaChartXml)
zip.file('ppt/diagrams/layout1.xml', diagramLayoutXml)
zip.file('ppt/diagrams/layout2.xml', cycleDiagramLayoutXml)
zip.file('ppt/diagrams/quickStyle1.xml', diagramQuickStyleXml)
zip.file('ppt/diagrams/colors1.xml', diagramColorsXml)
zip.file('ppt/diagrams/data1.xml', diagramDataXml)
zip.file('ppt/diagrams/data2.xml', cycleDiagramDataXml)
zip.file('ppt/diagrams/drawing1.xml', diagramDrawingXml)
zip.file('ppt/diagrams/drawing2.xml', cycleDiagramDrawingXml)
zip.file('ppt/diagrams/_rels/drawing1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`)
zip.file('ppt/diagrams/_rels/drawing2.xml.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`)

const buffer = await zip.generateAsync({ type: 'nodebuffer' })
await writeFile(outputPath, buffer)
console.log(`Wrote ${outputPath}`)
