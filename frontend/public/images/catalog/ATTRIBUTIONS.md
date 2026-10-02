# Catalog image attributions

Most product photos in this folder are now the client's **own product photography**, supplied directly and cropped/optimised for the storefront (resized to a max dimension of 1400px, re-encoded as JPEG). These are not covered by an external licence — they belong to the business.

A smaller number of entries are still **generic medical supply images** sourced from [Wikimedia Commons](https://commons.wikimedia.org/), used only where no client photo has been supplied yet. They illustrate product **types** only — not specific brands. Licenses used: **CC0 1.0 (Public Domain)** and **Public Domain** dedications unless noted below.

## Client photography (own images, no external licence)

Citric acid, iodine, surgical spirit, sodium hypochlorite, 5cc/10cc/20cc syringes, IV cannula, hypodermic needles, burette & standard infusion sets, dialysis concentrate & bicarbonate powder, dialyzer filters, central venous / long-term / acute HD catheters, AV fistula needles, regeneration salt, latex/nitrile/surgical/gynaecological/orthopaedic gloves, surgical facemask, oxygen mask, face shield, nylon apron, shoe cover, head cap, disposable gown, dressing, cotton wool, plain & X-ray gauze rolls, surgical blades, kidney dish, gallipot, HD green towel, bin liner, safety box, sanitary rolls, blood lancets, all surgical instruments (Dunhill artery forceps, blade holder, Sims uterine sound, curved/suture/Metzenbaum/umbilical-cord scissors, dressing/Allis/mosquito forceps, vaginal speculum, needle holder), and all BP machines/cuffs and glucometers/glucostrips in the Medical Equipment category.

## Remaining generic Wikimedia placeholders

| Local file | Wikimedia source (representative) | License |
|---|---|---|
| syringe-2cc.jpg | BD_3ml_syringe.jpg | CC0 |
| iv-giving-set.jpg *(unused — no product currently references this key)* | Intravenous_catheter.jpg | CC0 |
| dialysis-catheter.jpg *(unused — no product currently references this key)* | Dialysis_-_arm_-_01.jpg | CC0 |
| gauze.jpg *(unused — superseded by gauze-plain.jpg / gauze-xray.jpg)* | Gauze.jpg | See Commons file page |
| linen.jpg | Hospital_bed.jpg | See Commons file page |
| test-glucose.jpg | Glucometer.jpg | See Commons file page |
| test-urinalysis.jpg | Category representative (glucometer) | See Commons file page |
| test-pregnancy.jpg | Pregnancy_test.jpg | See Commons file page |
| test-rapid.jpg | Rapid_test.jpg | See Commons file page |
| lab-slides.jpg | Microscopy_slide.jpg | See Commons file page |
| lab-vacutainer.jpg, lab-specimen.jpg | Vacutainer_tubes.jpg | See Commons file page |
| bp-digital.jpg *(unused — superseded by bp-omron.jpg / bp-citizen.jpg / etc.)* | Sphygmomanometer.jpg | See Commons file page |
| thermometer.jpg | Digital_thermometer.jpg | See Commons file page |
| oxygen-regulator.jpg | Oxygen_cylinder.jpg | See Commons file page |
| autoclave.jpg | Autoclave.jpg | See Commons file page |
| hero-clinic.jpg | Hospital_ward.jpg | See Commons file page |
| equipment-default.jpg | Hospital_equipment.jpg | See Commons file page |

The Diagnostics & Lab category (glucose/urinalysis/pregnancy/rapid tests, microscope slides, vacutainer tubes, specimen containers) and Clinical Thermometers / Oxygen Regulators / Autoclave Machines in Medical Equipment still use these generic placeholders — no client photos have been supplied for these lines yet.

Three keys (`iv-giving-set`, `dialysis-catheter`, `gauze`) and `bp-digital` are kept in the type/lookup tables for backward compatibility but are no longer referenced by any product — their old placeholder files can be deleted if you want to reclaim the space, but leaving them is harmless.

To refresh remaining placeholder images: `node scripts/download-catalog-images.mjs`. That script was not reviewed as part of this update — before running it, check that it only fetches images for keys still listed in the "Remaining generic Wikimedia placeholders" table above, so it doesn't overwrite the client's own photography.
