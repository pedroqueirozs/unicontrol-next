import {
  Document,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableCell,
  TableRow,
  WidthType,
  BorderStyle,
  AlignmentType,
  VerticalAlign,
  TableLayoutType,
} from "docx"

export type CompanySender = {
  name: string
  street: string
  district: string
  city: string
  state: string
  zip: string
  phone: string
  whatsapp: string
}

export type PrintQueueItem = {
  id: string
  sourceType: "client" | "supplier"
  name: string
  code: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  amount: number
}

export async function generateDocx(
  addresses: PrintQueueItem[],
  sender: CompanySender,
  logoBuffer: ArrayBuffer | null = null,
  logoType: "png" | "jpg" = "jpg"
): Promise<Blob> {
  const recipientBlock = (addr: PrintQueueItem): Paragraph[] => {
    const paragraphs: Paragraph[] = [
      new Paragraph({
        children: [
          new TextRun({ text: "DESTINATÁRIO: ", bold: true, size: 32 }),
          new TextRun({ text: addr.name.toUpperCase(), size: 34, bold: true }),
        ],
        alignment: AlignmentType.LEFT,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Endereço: ", bold: true, size: 22 }),
          new TextRun({
            text: addr.number ? `${addr.street}, ${addr.number}` : addr.street,
            size: 22,
          }),
        ],
        alignment: AlignmentType.LEFT,
        spacing: { after: 50 },
      }),
    ]

    if (addr.complement) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Complemento: ", bold: true, size: 22 }),
            new TextRun({ text: addr.complement, size: 22 }),
          ],
          alignment: AlignmentType.LEFT,
          spacing: { after: 50 },
        })
      )
    }

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Bairro: ", bold: true, size: 22 }),
          new TextRun({ text: addr.neighborhood, size: 22 }),
        ],
        alignment: AlignmentType.LEFT,
        spacing: { after: 50 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "CEP: ", bold: true, size: 22 }),
          new TextRun({ text: addr.zipCode, size: 22 }),
        ],
        alignment: AlignmentType.LEFT,
        spacing: { after: 50 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Cidade: ", bold: true, size: 22 }),
          new TextRun({
            text: addr.state ? `${addr.city}  -  ${addr.state}` : addr.city,
            size: 22,
          }),
        ],
        alignment: AlignmentType.LEFT,
        spacing: { after: 50 },
      })
    )

    return paragraphs
  }

  const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
  const noMargin = { top: 0, bottom: 0, left: 0, right: 0 }

  const senderInfoParagraphs = [
    new Paragraph({
      children: [
        new TextRun({ text: sender.name.toUpperCase(), size: 24, bold: true }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `${sender.street} - ${sender.district}`, size: 18 }),
      ],
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${sender.city} - ${sender.state} - ${sender.zip}`,
          size: 18,
        }),
      ],
      alignment: AlignmentType.LEFT,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Tel.: ${sender.phone} | WhatsApp: ${sender.whatsapp}`,
          size: 18,
        }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { before: 40 },
    }),
  ]

  const senderBlock = (): (Paragraph | Table)[] => {
    if (!logoBuffer) return senderInfoParagraphs

    return [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        borders: {
          top: noBorder,
          bottom: noBorder,
          left: noBorder,
          right: noBorder,
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 20, type: WidthType.PERCENTAGE },
                borders: {
                  top: noBorder,
                  bottom: noBorder,
                  left: noBorder,
                  right: noBorder,
                },
                margins: noMargin,
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    children: [
                      new ImageRun({
                        data: logoBuffer,
                        transformation: { width: 55, height: 55 },
                        type: logoType,
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
              new TableCell({
                width: { size: 80, type: WidthType.PERCENTAGE },
                borders: {
                  top: noBorder,
                  bottom: noBorder,
                  left: noBorder,
                  right: noBorder,
                },
                margins: noMargin,
                verticalAlign: VerticalAlign.CENTER,
                children: senderInfoParagraphs,
              }),
            ],
          }),
        ],
      }),
    ]
  }

  const labelRows = addresses.flatMap((addr) =>
    Array(addr.amount)
      .fill(null)
      .map(
        () =>
          new TableRow({
            children: [
              new TableCell({
                children: [
                  ...recipientBlock(addr),
                  new Paragraph({
                    children: [new TextRun({ text: " ", size: 1, break: 1 })],
                    border: {
                      top: {
                        style: BorderStyle.SINGLE,
                        size: 2,
                        color: "000000",
                      },
                    },
                    spacing: { before: 100, after: 100 },
                  }),
                  ...senderBlock(),
                ],
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                  bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                  left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                  right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                },
                margins: { top: 200, bottom: 200, left: 200, right: 200 },
              }),
            ],
          })
      )
  )

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: labelRows,
          }),
        ],
      },
    ],
  })

  return Packer.toBlob(doc)
}
