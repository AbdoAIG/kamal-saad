from pypdf import PdfReader, PdfWriter

reader = PdfReader("/home/z/my-project/download/maktabati_feature_suggestions.pdf")
writer = PdfWriter()

for page in reader.pages:
    writer.add_page(page)

writer.add_metadata({
    '/Title': 'مقترحات مميزات موقع كمال سعد',
    '/Author': 'Z.ai',
    '/Subject': 'تقرير شامل بالمميزات الإضافية المقترحة لموقع كمال سعد للقرطاسية',
    '/Creator': 'Z.ai'
})

with open("/home/z/my-project/download/maktabati_feature_suggestions.pdf", "wb") as output:
    writer.write(output)

print("Metadata added successfully!")
