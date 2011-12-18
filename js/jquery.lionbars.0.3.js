(function( $ ) {
    $.fn.hasScrollBar = function() {
        return this.get(0).scrollHeight > this.height();
    };
	$.fn.lionbars = function(options) {
		options = options || {};
		autohide = options.autohide;
		
		// Flags
		var timeout,
			HDragging=false,
			VDragging=false,
			activeScroll=0,
			activeWrap=0,
			eventX,
			eventY,
			mouseX,
			mouseY,
			currentRatio,
			initPos,
			scrollValue,
			hideTimeoutSet=false,
			vEventFired = false,
			hEventFired = false;
		
		// Initialization
		var elements = $(this),
			id = 0,
			vScrollWidth=0, hScrollWidth=0,
			addHScroll=false, addVScroll=false,
			paddingTop=0, paddingLeft=0, paddingBottom=0, paddingRight=0,
			borderTop=0, borderRight=0, borderBottom=0, borderLeft=0,
			scrollHeight=0, scrollWidth=0, offsetWidth=0, offsetHeight=0, clientWidth=0, clientHeight=0,
			vRatio=0, hRatio=0,
			vSliderHeight=0, hSliderHeight=0,
			vLbHeight=0, hLbHeight=0;
		
		// Main Loop
		mainLoop();
		
		function mainLoop() {
			for (var i=0; elements[i] !== undefined; i++) {
				if (needScrollbars(elements[i]) && !$(elements[i]).hasClass('nolionbars') && !hasScrollbars(elements[i])) {
					// add the element to the main array
					target = elements[i];
					
					// if the has scrollbars, remove them
					// HASSCROLLBARS() NOT WORKING PROPERLY when you change the content of the div before calling lionbars() on it.
					if (hasScrollbars(elements[i])) {
						var lbWrap = $(target).find('.lb-wrap');
						
						getPadding(lbWrap);
						movePadding(lbWrap, target);
						unwrap(target);
						unResizeMainBox(target);
						
						resetVars();
						// delete me
						return false;
					}
					
					// get some values before the element is wrapped
					getDimentions(target);
					
					// wrap the element
					wrap(target, addVScroll, addHScroll);
					
					// hide the default scrollbar
					hideScrollbars(target, addVScroll, addHScroll);
					
					// Calculate the size of the scrollbars
					reduceScrollbarsWidthHeight(target);
					setSlidersHeight(target);
					
					// Set variables needed to calculate scroll speed, etc.
					setScrollRatios(target);
					
					// Set events
					setEvents(target);
					
					// prepare for next element
					resetVars();
				}
			}
		}
		
		// Set document events
		$(document).mousemove(function(e) {
			if (VDragging) {
				mouseY = e.pageY;
				activeWrap.scrollTop((initPos + mouseY - eventY) * Math.abs(currentRatio));
			}
			if (HDragging) {
				mouseX = e.pageX;
				activeWrap.scrollLeft((initPos + mouseX - eventX) * Math.abs(currentRatio));
			}
		});
		$(document).mouseup(function(e) {
			if (VDragging) {
				VDragging = false;
			}
			if (HDragging) {
				HDragging = false;
			}
		});
		
		// Core functions
		function setEvents(elem) {
			var el = $(elem);
			
			if (addVScroll || addHScroll) {
				el.find('.lb-wrap').scroll(function(e) {
					el.find('.lb-v-scrollbar-slider').css({ "top" : -$(this).scrollTop()/el.attr('vratio') });
					el.find('.lb-h-scrollbar-slider').css({ "left" : -$(this).scrollLeft()/el.attr('hratio') });
					
					if (el.find('.lb-v-scrollbar').height() == (parseInt(el.find('.lb-v-scrollbar-slider').css('top')) + el.find('.lb-v-scrollbar-slider').height())
						&& typeof(options.reachedBottom) == 'function'
						&& !vEventFired
					) {
						vEventFired = true;
						var self = $(this);
						
						// TODO: make this work for ie8 and opera
						$(this).children('.lb-content').bind('DOMSubtreeModified', function () {
							refresh($(self).parent());
							vEventFired = false;
							$(self).children('.lb-content').unbind('DOMSubtreeModified');
						});
						
						options.reachedBottom.apply($(this).children('.lb-content'));
					}
					
					if (el.find('.lb-h-scrollbar').width() == (parseInt(el.find('.lb-h-scrollbar-slider').css('left')) + el.find('.lb-h-scrollbar-slider').width())
						&& typeof(options.reachedRight) == 'function'
						&& !hEventFired
					) {
						hEventFired = true;
						var self = $(this);
						
						// TODO: make this work for ie8 and opera
						$(this).children('.lb-content').bind('DOMSubtreeModified', function () {
							// Nikolay: I'm still struggling to understand that reachedBottom thing. 
							// The commented code below was duplicated and since the original code is obsolete, I'm commenting this as well.
							
							/*
							getDimentions($(self).parent(), {
								height: $(self).children('.lb-content').get(0).scrollHeight,
								width: $(self).children('.lb-content').get(0).scrollWidth
							});
							
							// Calculate the size of the scrollbars
							reduceScrollbarsWidthHeight($(self).parent());
							setSlidersHeight($(self).parent());
							
							// Set variables needed to calculate scroll speed, etc.
							setScrollRatios($(self).parent());
							
							// prepare for next element
							resetVars();
							*/
							
							refresh($(self).parent());
							vEventFired = false;
							$(self).children('.lb-content').unbind('DOMSubtreeModified');
						});
						
						options.reachedRight.apply($(this).children('.lb-content'));
					}
					
					if (autohide) {
						el.find('.lb-v-scrollbar, .lb-h-scrollbar').fadeIn(150);
						clearTimeout(timeout);
						timeout = setTimeout(function() {
							el.find('.lb-v-scrollbar, .lb-h-scrollbar').fadeOut(150);
						}, 2000);
					}
				});
			}
			
			if (addVScroll) {
				el.find('.lb-v-scrollbar-slider').mousedown(function(e) {
					eventY = e.pageY;
				
					VDragging = true;
					activeScroll = $(this);
					activeWrap = el.find('.lb-wrap');
					currentRatio = activeWrap.parent().attr('vratio');
					initPos = activeScroll.position().top;
					return false;
				});
				el.find('.lb-v-scrollbar').mousedown(function(e) {
					if (!$(e.target).hasClass('lb-v-scrollbar-slider')) {
						el.find('.lb-wrap').scrollTop((e.pageY - $(this).offset().top) * Math.abs(el.attr('vratio')) - $(this).find('.lb-v-scrollbar-slider').height()/2);
					}
					return false;
				});
			}
			
			if (addHScroll) {
				el.find('.lb-h-scrollbar-slider').mousedown(function(e) {
					eventX = e.pageX;
					
					HDragging = true;
					activeScroll = $(this);
					activeWrap = el.find('.lb-wrap');
					currentRatio = activeWrap.parent().attr('hratio');
					initPos = activeScroll.position().left;
					return false;					
				});
				el.find('.lb-h-scrollbar').mousedown(function(e) {
					if (!$(e.target).hasClass('lb-h-scrollbar-slider')) {
						el.find('.lb-wrap').scrollLeft((e.pageX - $(this).offset().left) * Math.abs(el.attr('hratio')) - $(this).find('.lb-h-scrollbar-slider').width()/2);
					}
					return false;
				});
			}
			
			if ((addVScroll || addHScroll) && autohide) {
				el.find('.lb-v-scrollbar, .lb-h-scrollbar').hide();
				
				el.find('.lb-v, .lb-h').hover(function() {
					clearTimeout(timeout);
					el.find('.lb-v-scrollbar, .lb-h-scrollbar').fadeIn(150);
				}, function() {
					clearTimeout(timeout);
					timeout = setTimeout(function() {
						el.find('.lb-v-scrollbar, .lb-h-scrollbar').fadeOut(150);
					}, 2000);
				});
			}
		}
		function refresh(elem) {
			var el = $(elem);
			refreshDimentions(el);
			reduceScrollbarsWidthHeight(el);
			setSlidersHeight(el);
			setScrollRatios(el);
			resetVars();
		}
		function refreshDimentions(elem) {
			var el = $(elem).get(0);
			var wrap = $(elem).find('.lb-wrap').get(0);
			
			scrollHeight = wrap.scrollHeight;
			scrollWidth = wrap.scrollWidth;
			clientHeight = el.clientHeight;
			clientWidth = el.clientWidth;
			offsetHeight = el.offsetHeight;
			offsetWidth = el.offsetWidth;
			
			// those seem kinda not necessary
			//setVScrollWidth($(elem));
			//ssetHScrollWidth($(elem));
		}
		function setScrollRatios(elem) {
			vRatio = (offsetHeight - $(elem).find('.lb-wrap').get(0).scrollHeight - borderTop - borderBottom)/(vLbHeight - vSliderHeight);
			hRatio = (offsetWidth - $(elem).find('.lb-wrap').get(0).scrollWidth - borderLeft - borderRight)/(hLbHeight - hSliderHeight);
			
			var el = $(elem);
			el.attr('vratio', vRatio);
			el.attr('hratio', hRatio);
		}
		function setSlidersHeight(elem) {
			var el = $(elem);
			var hmin, hmax, gap;
			
			if (el.find('.lb-v').length != 0) {
				hmin = 20;
				gap = offsetHeight - el.find('.lb-v-scrollbar').height();
				hmax = offsetHeight - gap - hmin;
				vSliderHeight = Math.round((offsetHeight*hmax)/scrollHeight);
				vSliderHeight = (vSliderHeight < hmin) ? hmin : vSliderHeight;
				vSliderHeight = (vSliderHeight > hmax) ? hmax : vSliderHeight;
			}
			
			if (el.find('.lb-h').length != 0) {
				hmin = 20;
				gap = offsetWidth - el.find('.lb-h-scrollbar').width();
				hmax = offsetWidth - gap - hmin;
				hSliderHeight = Math.round((offsetWidth*hmax)/scrollWidth);
				hSliderHeight = (hSliderHeight < hmin) ? hmin : hSliderHeight;
				hSliderHeight = (hSliderHeight > hmax) ? hmax : hSliderHeight;
			}
			el.find('.lb-v-scrollbar-slider').css({ "height" : vSliderHeight });
			el.find('.lb-h-scrollbar-slider').css({ "width" : hSliderHeight });
		}
		function resetVars() {
			vScrollWidth = 0;
			hScrollWidth = 0;
			addHScroll=false;
			addVScroll=false;
			paddingTop = 0;
			paddingLeft = 0;
			paddingBottom = 0;
			paddingRight = 0;
			borderTop = 0;
			borderLeft = 0;
			borderBottom = 0;
			borderRight = 0;
			scrollHeight = 0;
			scrollWidth = 0;
			offsetWidth = 0;
			offsetHeight = 0;
			clientWidth = 0;
			clientHeight = 0;
			// vRatio = 0;
			// hRatio = 0;
			vSliderHeight = 0;
			hSliderHeight = 0;
			vLbHeight = 0;
			hLbHeight = 0;
		}
		function reduceScrollbarsWidthHeight(elem) {
			var el = $(elem);
			
			// changed to look for the actual HTML of the scrollbar instead of the variable, telling if there is a scrollbar or not.
			if (el.find('.lb-v').length != 0 && el.find('.lb-h').length != 0) {
				vLbHeight = el.height()-12;
				hLbHeight = el.width()-12;
				el.find('.lb-v').css({ "height" : vLbHeight });
				el.find('.lb-h').css({ "width" : hLbHeight });
			} else {
				vLbHeight = el.height()-4;
				hLbHeight = el.width()-4;
				el.find('.lb-v').css({ "height" : vLbHeight });
				el.find('.lb-h').css({ "width" : hLbHeight });
			}
		}
		function hideScrollbars(elem, vscroll, hscroll) {
			var el = $(elem);
			
			if (vscroll || hscroll) {
				el.css({ "overflow" : 'hidden' });
				movePadding(el, el.find('.lb-wrap'));
				resizeMainBox(el);
				resizeInnerWrap(el, el.find('.lb-wrap'));
			}
		}
		function resizeMainBox(elem) {
			var el = $(elem);
			el.css({ "width" : el.width() + paddingLeft + paddingRight, "height" : el.height() + paddingTop + paddingBottom });
		}
		function unResizeMainBox(elem) {
			console.log('unresize');
			$(elem).removeAttr('style').removeAttr('vratio').removeAttr('hratio');
		}
		function movePadding(from, to) {
			var fromEl = $(from);
			var toEl = $(to);
			
			console.log(fromEl, toEl);
			
			fromEl.css({ "padding" : 0 });
			toEl.css({
				"padding-top" : paddingTop+'px',
				"padding-left" : paddingLeft+'px',
				"padding-bottom" : paddingBottom+'px',
				"padding-right" : paddingRight+'px' 
			});
		}
		function resizeInnerWrap(main, child) {
			var mainEl = $(main);
			var childEl = $(child);
			mainEl.css({ "position" : 'relative' });
			childEl.css({
				"width" : mainEl.width()+vScrollWidth - paddingLeft - paddingRight, 
				"height" : mainEl.height()+hScrollWidth - paddingTop - paddingBottom 
			});
		}
		function setVScrollWidth(elem) {
			var el = $(elem);
			el.css({ "overflow" : 'auto' });
			vScrollWidth = offsetWidth - clientWidth - borderLeft - borderRight;
			el.css({ "overflow" : 'hidden' });
		}
		function setHScrollWidth(elem) {
			var el = $(elem);
			el.css({ "overflow" : 'auto' });
			hScrollWidth = offsetHeight - clientHeight - borderTop - borderBottom;
			el.css({ "overflow" : 'hidden' });
		}
		function unwrap (elem) {
			var el = $(elem);
			
			el.find('.lb-v').remove();
			el.find('.lb-h').remove();
			el.find('.lb-content').unwrap().children().first().unwrap();
		}
		function wrap(elem, vscroll, hscroll) {
			var el = $(elem);
			var elemId = el.attr('id');
			var wrap = 0;
			
			if (elemId !== undefined) {
				el.wrapInner('<div class="lb-wrap" id="lb-wrap-'+id+'-'+elemId+'"></div>');
				wrap = $('#lb-wrap-'+id+'-'+elemId);
			} else {
				el.wrapInner('<div class="lb-wrap" id="lb-wrap-'+id+'"></div>');
				wrap = $('#lb-wrap-'+id);
			}
			wrap.wrapInner('<div class="lb-content"></div>');
			if (vscroll) {
				el.prepend('<div class="lb-v"><div class="lb-v-scrollbar"></div></div>');
				el.find('.lb-v-scrollbar').append('<div class="lb-v-scrollbar-slider"></div>');
			}
			if (hscroll) {
				el.prepend('<div class="lb-h"><div class="lb-h-scrollbar"></div></div>');
				el.find('.lb-h-scrollbar').append('<div class="lb-h-scrollbar-slider"></div>');
			}

			// preparation for the next element
			id = id + 1;
		}
		function needScrollbars(elem) {
			var el = $(elem);
			addVScroll = false;
			addHScroll = false;
			
			getPadding(el);
			getBorders(el);
			
			el.css({ "overflow" : 'hidden' });
			
			// check for vertical scrollbars
			if (el.get(0).scrollHeight > el.get(0).clientHeight) {
				addVScroll = true;
				// setVScrollWidth(el);
			}
			
			// check for horizontal scrollbars
			if (el.get(0).scrollWidth > el.get(0).clientWidth) {
				addHScroll = true;
				// setHScrollWidth(el);
			}
			
			el.css({ "overflow" : 'auto' });
			
			if (addVScroll || addHScroll) {
 				return true;
 			}			
		}
		function hasScrollbars(elem) {
			if ($(elem).find('.lb-wrap').length == 0) {
				return false;
			} else {
				return true;
			}
		}
		function getPadding(elem) {
			var el = $(elem);
			
			paddingTop = parseInt(el.css('padding-top').replace('px', ''));
			paddingLeft = parseInt(el.css('padding-left').replace('px', ''));
			paddingBottom = parseInt(el.css('padding-bottom').replace('px', ''));
			paddingRight = parseInt(el.css('padding-right').replace('px', ''));
		}
		function getBorders(elem) {
			var el = $(elem);
			
			borderTop = parseInt(el.css('border-top-width').replace('px', ''));
			borderRight = parseInt(el.css('border-right-width').replace('px', ''));
			borderBottom = parseInt(el.css('border-bottom-width').replace('px', ''));
			borderLeft = parseInt(el.css('border-left-width').replace('px', ''));
		}
		function getDimentions(elem, scroll) {
			var el = $(elem).get(0);
			
			scrollHeight = (typeof(scroll) != 'undefined') ? scroll.height : el.scrollHeight;
			scrollWidth = (typeof(scroll) != 'undefined') ? scroll.width : el.scrollWidth;
			clientHeight = el.clientHeight;
			clientWidth = el.clientWidth;
			offsetHeight = el.offsetHeight;
			offsetWidth = el.offsetWidth;
			
			setVScrollWidth($(elem));
			setHScrollWidth($(elem));
		}
		
		return this.each(function() {
			//var $this = $(this);
		});
	};
})( jQuery );