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
		<p class="kicker"><?php echo esc_html( txht_opt( 'txht_hero_kicker' ) ); ?></p>
		<h1><?php echo esc_html( txht_opt( 'txht_hero_headline' ) ); ?> <em><?php echo esc_html( txht_opt( 'txht_hero_accent' ) ); ?></em></h1>
		<p class="sub"><?php echo esc_html( txht_opt( 'txht_hero_sub' ) ); ?></p>
		<div class="hero-ctas">
			<a class="btn btn--solid" href="<?php echo esc_url( txht_opt( 'txht_cta1_url' ) ); ?>"><?php echo esc_html( txht_opt( 'txht_cta1_label' ) ); ?></a>
			<a class="btn" href="<?php echo esc_url( txht_opt( 'txht_cta2_url' ) ); ?>"><?php echo esc_html( txht_opt( 'txht_cta2_label' ) ); ?></a>
		</div>

		<div class="info-plate" aria-label="Shop information">
			<div>
				<div class="label">FFL License</div>
				<div class="value"><?php echo esc_html( txht_opt( 'txht_ffl' ) ); ?></div>
			</div>
			<div>
				<div class="label">Location</div>
				<div class="value"><?php echo esc_html( txht_opt( 'txht_plate_location' ) ); ?></div>
			</div>
			<div>
				<div class="label">Shop Floor</div>
				<div class="value"><?php echo esc_html( txht_opt( 'txht_plate_floor' ) ); ?></div>
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
		<p class="kicker"><?php echo esc_html( txht_opt( 'txht_caps_kicker' ) ); ?></p>
		<h2><?php echo esc_html( txht_opt( 'txht_caps_heading' ) ); ?></h2>
		<p class="section-lede"><?php echo esc_html( txht_opt( 'txht_caps_lede' ) ); ?></p>

		<div class="cap-grid">
			<?php for ( $i = 1; $i <= 6; $i++ ) : ?>
			<div class="cap-cell">
				<div class="idx"><?php echo esc_html( txht_opt( "txht_cap{$i}_idx" ) ); ?></div>
				<h3><?php echo esc_html( txht_opt( "txht_cap{$i}_title" ) ); ?></h3>
				<p><?php echo esc_html( txht_opt( "txht_cap{$i}_desc" ) ); ?></p>
				<div class="spec"><?php echo esc_html( txht_opt( "txht_cap{$i}_spec" ) ); ?></div>
			</div>
			<?php endfor; ?>
		</div>
	</div>
</section>

<section id="shop">
	<div class="wrap">
		<p class="kicker"><?php echo esc_html( txht_opt( 'txht_shop_kicker' ) ); ?></p>
		<h2><?php echo esc_html( txht_opt( 'txht_shop_heading' ) ); ?></h2>
		<p class="section-lede"><?php echo esc_html( txht_opt( 'txht_shop_lede' ) ); ?></p>

		<div class="shop-note">
			<strong><?php echo esc_html( txht_opt( 'txht_shop_note_label' ) ); ?></strong>
			<span><?php echo esc_html( txht_opt( 'txht_shop_note_text' ) ); ?></span>
		</div>

		<div class="ecwid-shell">
			<?php txht_render_store(); ?>
		</div>
	</div>
</section>

<section id="custom-work">
	<div class="wrap">
		<p class="kicker"><?php echo esc_html( txht_opt( 'txht_process_kicker' ) ); ?></p>
		<h2><?php echo esc_html( txht_opt( 'txht_process_heading' ) ); ?></h2>
		<p class="section-lede"><?php echo esc_html( txht_opt( 'txht_process_lede' ) ); ?></p>

		<div class="process-strip">
			<?php for ( $i = 1; $i <= 4; $i++ ) : ?>
			<div class="process-step">
				<div class="num">STEP 0<?php echo (int) $i; ?></div>
				<h3><?php echo esc_html( txht_opt( "txht_step{$i}_title" ) ); ?></h3>
				<p><?php echo esc_html( txht_opt( "txht_step{$i}_desc" ) ); ?></p>
			</div>
			<?php endfor; ?>
		</div>
	</div>
</section>

<section id="contact">
	<div class="wrap">
		<p class="kicker"><?php echo esc_html( txht_opt( 'txht_contact_kicker' ) ); ?></p>
		<h2><?php echo esc_html( txht_opt( 'txht_contact_heading' ) ); ?></h2>

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
