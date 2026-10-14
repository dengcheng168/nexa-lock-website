import { PrismaClient } from '@prisma/client';
import { toJsonString } from '../src/lib/json.js';

const prisma = new PrismaClient();

const categories = [
  ['reverse-osmosis-systems', 'residential-smart-locks', 'Residential Smart Locks', 'Fingerprint, PIN, card and app-enabled locks for apartments and private homes.'],
  ['commercial-industrial-filtration', 'hospitality-apartment-locks', 'Hospitality & Apartment Locks', 'Connected access hardware for hotels, rentals and managed residential properties.'],
  ['whole-house-water-filters', 'glass-specialty-door-locks', 'Glass & Specialty Door Locks', 'Purpose-built smart locks for glass, narrow-frame and other specialty doors.'],
] as const;

const products = [
  ['ro-500-under-sink-reverse-osmosis-system', 'a1-slim-fingerprint-smart-lock', 'A1 Slim Fingerprint Smart Lock', 'SL-A1', 'A slim fingerprint and PIN lock for modern residential doors, ready for OEM branding.'],
  ['ro-800-countertop-reverse-osmosis-system', 'a2-wifi-video-smart-lock', 'A2 Wi-Fi Video Smart Lock', 'SL-A2', 'Smart entry lock with camera, doorbell and remote app management.'],
  ['cf-2000-commercial-filtration-skid', 'h1-hotel-rfid-lock', 'H1 Hotel RFID Lock', 'SL-H1', 'RFID hotel lock designed for room-management and hospitality projects.'],
  ['cf-5000-industrial-ro-plant', 'm1-managed-apartment-smart-lock', 'M1 Managed Apartment Smart Lock', 'SL-M1', 'Connected lock for rental apartments and multi-family property operations.'],
  ['wh-100-whole-house-sediment-filter', 'g1-glass-door-smart-lock', 'G1 Glass Door Smart Lock', 'SL-G1', 'Clamp-mounted smart lock for compatible frameless glass doors.'],
  ['wh-200-whole-house-water-softener', 'n1-narrow-frame-smart-lock', 'N1 Narrow-Frame Smart Lock', 'SL-N1', 'Slim smart lock designed for compatible aluminum-frame doors.'],
] as const;

async function main() {
  for (const [oldSlug, slug, name, description] of categories) {
    await prisma.productCategory.updateMany({ where: { slug: oldSlug }, data: { slug, name, description } });
  }

  for (const [oldSlug, slug, name, sku, shortDescription] of products) {
    await prisma.product.updateMany({
      where: { slug: oldSlug },
      data: {
        slug,
        name,
        sku,
        shortDescription,
        description: '<p>A configurable smart access platform for residential and commercial projects. Final functions and compatibility depend on the confirmed model and door specification.</p>',
        specs: toJsonString([
          { label: 'Access Methods', value: 'Fingerprint / PIN / Card / Key' },
          { label: 'Power', value: 'Battery powered' },
        ]),
        features: toJsonString(['Multiple access credentials', 'Low-battery alert', 'OEM/ODM ready']),
      },
    });
  }

  await prisma.siteSetting.update({
    where: { id: 1 },
    data: {
      companyName: 'Placeholder Smart Lock Technology Co., Ltd.',
      brandName: 'NEXA LOCK',
      heroHeadline: 'Smart Access. Built Around You.',
      heroSubheadline: 'Connected smart locks for homes, apartments and hospitality projects — engineered for secure, effortless entry.',
      heroButton1Text: 'Start a Project',
      heroButton2Text: 'Explore Smart Locks',
      heroDesktopImage: '/images/smart-lock/hero-smart-lock.png',
      heroMobileImage: '/images/smart-lock/hero-smart-lock.png',
      coreAdvantages: toJsonString([
        { title: 'Flexible Access', description: 'Configure fingerprint, PIN, card, app and mechanical-key access around each project.' },
        { title: 'Door-Fit Engineering', description: 'Coordinate lock body, backset, door thickness and material before sampling.' },
        { title: 'OEM/ODM Delivery', description: 'Coordinate finishes, firmware options, logos, packaging and export preparation.' },
      ]),
    },
  });

  await prisma.blogPost.updateMany({
    where: { slug: 'how-to-choose-the-right-oem-water-purifier-partner' },
    data: {
      slug: 'how-to-choose-the-right-smart-lock-oem-partner',
      title: 'How to Choose the Right Smart Lock OEM Partner',
      excerpt: 'Key factors distributors should evaluate before selecting a smart lock OEM/ODM manufacturer.',
      body: '<p>Review product compatibility, access methods, quality-control workflow, firmware options and sample evaluation before confirming an OEM project.</p>',
    },
  });
  await prisma.blogPost.updateMany({
    where: { slug: 'understanding-ro-membrane-technology' },
    data: {
      slug: 'smart-lock-access-methods-explained',
      title: 'Smart Lock Access Methods Explained',
      excerpt: 'A practical overview of fingerprint, PIN, card, app and mechanical-key access.',
      body: '<p>Compare common access methods by user experience, operating environment, credential management and fallback requirements.</p>',
    },
  });

  await prisma.faq.updateMany({
    where: { question: 'Can you provide product certifications?' },
    data: {
      question: 'Which door types are compatible?',
      answer: 'Compatibility depends on door material, thickness, backset and lock-body dimensions. Share your door details so our team can confirm fit before ordering.',
    },
  });

  console.log('Smart-lock demo content updated.');
}

main().finally(() => prisma.$disconnect());
