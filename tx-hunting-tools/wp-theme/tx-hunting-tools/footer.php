<footer class="site-footer">
	<div class="wrap">
		<div class="copyright">
			&copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> <?php bloginfo( 'name' ); ?> LLC &middot; League City, TX
		</div>
		<?php
		if ( has_nav_menu( 'footer' ) ) {
			wp_nav_menu(
				array(
					'theme_location' => 'footer',
					'container'      => false,
					'menu_class'     => 'footer-links',
				)
			);
		} else {
			// Fallback until Terms / Privacy / FFL Info pages exist and a menu is assigned.
			?>
			<ul class="footer-links">
				<li><a href="<?php echo esc_url( home_url( '/terms/' ) ); ?>">Terms</a></li>
				<li><a href="<?php echo esc_url( home_url( '/privacy/' ) ); ?>">Privacy</a></li>
				<li><a href="<?php echo esc_url( home_url( '/ffl-info/' ) ); ?>">FFL Info</a></li>
			</ul>
			<?php
		}
		?>
	</div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
