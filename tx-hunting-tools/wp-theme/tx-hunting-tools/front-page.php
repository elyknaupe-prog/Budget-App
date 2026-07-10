<?php
/**
 * Homepage — the 7-section layout from the design sketch:
 * nav (header.php) / hero / capabilities / shop (Ecwid) /
 * process strip / contact / footer (footer.php).
 */

get_header();
?>

<section class="hero">
	<div class="wrap">
		<p class="kicker">07/02 FFL Manufacturer — League City, Texas</p>
		<h1>Machined for the field. <em>Built in-house.</em></h1>
		<p class="sub">
			Custom suppressors, firearm work, and precision-machined hunting gear
			out of our own shop — 5-axis CNC, manual lathes, laser engraving,
			welding, and 3D printing under one roof. Regulated items transfer
			through our League City shop; gear ships nationwide.
		</p>
		<div class="hero-ctas">
			<a class="btn btn--solid" href="#shop">Shop Now</a>
			<a class="btn" href="#custom-work">Start a Custom Build</a>
		</div>

		<div class="info-plate" aria-label="Shop information">
			<div>
				<div class="label">FFL License</div>
				<div class="value"><?php echo esc_html( txht_opt( 'txht_ffl' ) ); ?></div>
			</div>
			<div>
				<div class="label">Location</div>
				<div class="value">League City, TX</div>
			</div>
			<div>
				<div class="label">Shop Floor</div>
				<div class="value">CNC &middot; LATHE &middot; LASER &middot; WELD</div>
			</div>
			<div>
				<div class="label">Season</div>
				<div class="value rust"><?php echo esc_html( txht_opt( 'txht_season' ) ); ?></div>
			</div>
		</div>
	</div>
</section>

<section id="capabilities">
	<div class="wrap">
		<p class="kicker">Capabilities</p>
		<h2>The Nameplate</h2>
		<p class="section-lede">
			Everything we sell is backed by the machines it was made on.
			No drop-shipped catalog — this is the actual floor.
		</p>

		<div class="cap-grid">
			<div class="cap-cell">
				<div class="idx">01 / CNC</div>
				<h3>5-Axis CNC Milling</h3>
				<p>Baffle stacks, tube bodies, receivers, and one-off fixtures cut from billet.</p>
				<div class="spec">5-AXIS &middot; ALUMINUM / TI / STAINLESS</div>
			</div>
			<div class="cap-cell">
				<div class="idx">02 / LATHE</div>
				<h3>Manual Lathe Work</h3>
				<p>Barrel threading, muzzle-device fitment, chamber and crown work.</p>
				<div class="spec">THREADING &middot; TURNING &middot; FITMENT</div>
			</div>
			<div class="cap-cell">
				<div class="idx">03 / LASER</div>
				<h3>Laser Engraving</h3>
				<p>ATF-compliant maker marks, serials, and custom graphics on metal.</p>
				<div class="spec">FORM 1 / FORM 2 MARKING</div>
			</div>
			<div class="cap-cell">
				<div class="idx">04 / WELD</div>
				<h3>Welding</h3>
				<p>TIG work on fixtures, brackets, blinds, and field-equipment repair.</p>
				<div class="spec">TIG &middot; STEEL / ALUMINUM</div>
			</div>
			<div class="cap-cell">
				<div class="idx">05 / PRINT</div>
				<h3>3D Printing</h3>
				<p>Rapid prototyping for grips, guards, and custom-build mockups before metal.</p>
				<div class="spec">PROTOTYPE &rarr; PRODUCTION</div>
			</div>
			<div class="cap-cell">
				<div class="idx">06 / FFL</div>
				<h3>FFL Transfers</h3>
				<p>In-shop transfers and NFA item handling under our 07/02 license.</p>
				<div class="spec"><?php echo esc_html( txht_opt( 'txht_ffl' ) ); ?></div>
			</div>
		</div>
	</div>
</section>

<section id="shop">
	<div class="wrap">
		<p class="kicker">Shop</p>
		<h2>Gear &amp; Builds</h2>
		<p class="section-lede">
			Optics, apparel, and field tools ship straight to you. Suppressors and
			custom firearms are transfer-only — pick up in-shop or arrange an FFL
			transfer after checkout.
		</p>

		<div class="shop-note">
			<strong>Transfer Only</strong>
			<span>Regulated items (suppressors, firearms) do not ship direct. Fulfillment is in-store pickup or FFL transfer — details on each product page.</span>
		</div>

		<div class="ecwid-shell">
			<?php txht_render_store(); ?>
		</div>
	</div>
</section>

<section id="custom-work">
	<div class="wrap">
		<p class="kicker">Custom Work</p>
		<h2>From Consult to Transfer</h2>
		<p class="section-lede">
			One shop handles the whole build — you talk to the person running the machine.
		</p>

		<div class="process-strip">
			<div class="process-step">
				<div class="num">STEP 01</div>
				<h3>Consult</h3>
				<p>Tell us the platform, use case, and constraints. We scope it honestly.</p>
			</div>
			<div class="process-step">
				<div class="num">STEP 02</div>
				<h3>Design</h3>
				<p>CAD and prototype passes — 3D-printed mockups before any metal is cut.</p>
			</div>
			<div class="process-step">
				<div class="num">STEP 03</div>
				<h3>Machine</h3>
				<p>Cut, welded, engraved, and finished in-house on our own equipment.</p>
			</div>
			<div class="process-step">
				<div class="num">STEP 04</div>
				<h3>Transfer</h3>
				<p>Regulated builds complete through compliant in-shop transfer and paperwork.</p>
			</div>
		</div>
	</div>
</section>

<section id="contact">
	<div class="wrap">
		<p class="kicker">Contact</p>
		<h2>Come By The Shop</h2>

		<div class="contact-grid">
			<div class="contact-plate">
				<div>
					<div class="label">Address</div>
					<div class="value"><?php echo esc_html( txht_opt( 'txht_address' ) ); ?></div>
				</div>
				<?php if ( txht_opt( 'txht_phone' ) ) : ?>
				<div>
					<div class="label">Phone</div>
					<div class="value"><a href="tel:<?php echo esc_attr( preg_replace( '/[^0-9+]/', '', txht_opt( 'txht_phone' ) ) ); ?>"><?php echo esc_html( txht_opt( 'txht_phone' ) ); ?></a></div>
				</div>
				<?php endif; ?>
				<div>
					<div class="label">Email</div>
					<div class="value"><a href="mailto:<?php echo esc_attr( txht_opt( 'txht_email' ) ); ?>"><?php echo esc_html( txht_opt( 'txht_email' ) ); ?></a></div>
				</div>
				<div>
					<div class="label">FFL License</div>
					<div class="value"><?php echo esc_html( txht_opt( 'txht_ffl' ) ); ?></div>
				</div>
			</div>

			<div class="map-frame">
				<iframe
					src="<?php echo esc_url( txht_map_src() ); ?>"
					loading="lazy"
					referrerpolicy="no-referrer-when-downgrade"
					title="Map to Texas Hunting Tools, League City TX"></iframe>
			</div>
		</div>
	</div>
</section>

<?php
get_footer();
