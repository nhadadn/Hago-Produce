
import { jsPDF } from 'jspdf'
import fs from 'fs'
import path from 'path'

const doc = new jsPDF()

doc.setFontSize(16)
doc.text('IPOLLITO FRUIT & PRODUCE', 10, 10)
doc.setFontSize(12)
doc.text('123 MARKET STREET', 10, 20)

let y = 40

// Category
doc.text('** ASPARAGUS **', 10, y)
y += 10
// Product
doc.text('ASPARAGUS GREEN LRG 11LB 45.00', 10, y)
y += 10

// Category
doc.text('** CARROTS **', 10, y)
y += 10
// Product with asterisk
doc.text("CARROTS TRI COLOR TOPS US 24'S 43.00*", 10, y)
y += 10

// Category
doc.text('** GARLIC **', 10, y)
y += 10
// Product
doc.text('GARLIC ELEPHANT US CASE 89.00', 10, y)
y += 10

// Category
doc.text('** BROCCOLI **', 10, y)
y += 10
// Product
doc.text('BROCCOLI CROWNS CASE 35.50', 10, y)
y += 10

// Category
doc.text('** CABBAGE **', 10, y)
y += 10
// Product
doc.text('CABBAGE GREEN 50LB 22.00', 10, y)
y += 10


const buffer = Buffer.from(doc.output('arraybuffer'))
const filePath = path.join(process.cwd(), 'ipollito-test.pdf')

fs.writeFileSync(filePath, buffer)
console.log(`PDF generated at: ${filePath}`)
