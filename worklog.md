---
Task ID: 1
Agent: Main Agent
Task: Banner system redesign with hotspot system and custom dimensions

Work Log:
- Updated Prisma schema: Removed old button fields (buttonText, buttonTextAr, buttonStyle, buttonPosition, size), added new fields (width, hotspotX, hotspotY, hotspotW, hotspotH)
- Ran prisma db push to sync schema with Neon PostgreSQL database
- Updated /api/banners API to handle new fields (width, hotspot coordinates)
- Completely rewrote PromotionalBanner.tsx: 
  - Removed CtaButton component (visible overlay buttons)
  - Added Hotspot component (invisible clickable zones positioned by percentage)
  - Hotspot uses percentage-based positioning for responsive behavior
  - Added custom width support per banner
  - Simplified PromoSection grid layout
- Completely rewrote BannersManagement component in admin/page.tsx:
  - Added interactive hotspot drawing: admin clicks and drags on the banner image to draw a rectangle
  - Visual feedback: green dashed rectangle for existing hotspot, blue rectangle while drawing
  - Coordinate display (X, Y, Width, Height in percentages)
  - Clear hotspot button
  - Replaced preset size buttons with custom width/height pixel inputs
  - Updated live preview to show hotspot zone
  - Updated banner cards in list to show hotspot indicator and dimensions
- All lint checks pass (only pre-existing warnings in test files and ImageUploader)

Stage Summary:
- Banner system now supports invisible clickable hotspots on images instead of visible overlay buttons
- Admin can draw hotspot rectangles directly on the banner image
- Custom width and height inputs replace preset sizes
- Database schema synced successfully
- Key files modified: prisma/schema.prisma, src/app/api/banners/route.ts, src/components/store/PromotionalBanner.tsx, src/app/admin/page.tsx
