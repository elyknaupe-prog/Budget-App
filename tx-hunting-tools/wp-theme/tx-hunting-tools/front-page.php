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

		<p><a class="btn btn--solid" href="<?php echo esc_url( txht_opt( 'txht_shop_btn_url' ) ); ?>"><?php echo esc_html( txht_opt( 'txht_shop_btn_label' ) ); ?></a></p>
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

			<?php if ( isset( $_GET['booked'] ) ) : ?>
				<?php if ( '1' === $_GET['booked'] ) : ?>
					<div class="form-notice form-notice--ok">Request received — we&rsquo;ll call you to confirm a time.</div>
				<?php else : ?>
					<div class="form-notice form-notice--err">Something went wrong sending your request. Please call or email us instead.</div>
				<?php endif; ?>
			<?php else : ?>
			<form class="book-form" method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<input type="hidden" name="action" value="txht_book">
				<?php wp_nonce_field( 'txht_book', 'txht_book_nonce' ); ?>
				<p class="hp-field"><label>Leave this field empty<input type="text" name="txht_website" tabindex="-1" autocomplete="off"></label></p>

				<div class="field">
					<label for="bk-name">Name *</label>
					<input id="bk-name" type="text" name="txht_name" required>
				</div>
				<div class="field">
					<label for="bk-phone">Phone Number *</label>
					<input id="bk-phone" type="tel" name="txht_phone" required placeholder="We&rsquo;ll call to confirm your appointment">
				</div>
				<div class="field">
					<label for="bk-service">What do you need?</label>
					<select id="bk-service" name="txht_service">
						<option>Suppressor</option>
						<option>Custom build</option>
						<option>Gunsmith work</option>
						<option>Optic / slide cut</option>
						<option>Muzzle device</option>
						<option>FFL transfer</option>
						<option>Other</option>
					</select>
				</div>
				<div class="field">
					<label for="bk-msg">Details (optional)</label>
					<textarea id="bk-msg" name="txht_message" rows="4"></textarea>
				</div>
				<button type="submit" class="btn btn--solid">Request Appointment</button>
			</form>
			<?php endif; ?>
		</div>
	</div>
</section>

<?php
get_footer();
